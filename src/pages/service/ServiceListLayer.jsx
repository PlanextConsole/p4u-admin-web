import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { deleteCatalogService, listCatalogServices, listCategoriesForServices } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import FormModal from "../../components/admin/FormModal";
import ServiceFormLayer from "./ServiceFormLayer";
import VendorServiceApprovalsLayer from "../vendor/VendorServiceApprovalsLayer";

function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

function formatServiceDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  const day = dt.toLocaleString("en-IN", { day: "numeric" });
  const mon = dt.toLocaleString("en-IN", { month: "short" });
  const yr = String(dt.getFullYear()).slice(-2);
  const time = dt.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} ${mon} ${yr}, ${time}`;
}

function serviceRef(srv) {
  if (srv.serviceRef) return srv.serviceRef;
  const id = String(srv.id || "");
  if (id.length >= 8) return `SVC-${id.slice(0, 8).toUpperCase()}`;
  return id ? `SVC-${id.slice(-6)}` : "—";
}

function parseMeta(srv) {
  const raw = srv.metadata;
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function serviceStatusKey(srv) {
  if (!srv.isActive && !srv.availability) return "rejected";
  if (!srv.isActive) return "pending";
  if (!srv.availability) return "draft";
  return "active";
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending Approval" },
  { key: "active", label: "Active" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Draft" },
];

const ServiceListLayer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageTab = searchParams.get("tab") === "approvals" ? "approvals" : "catalog";

  const selectPageTab = (next) => {
    if (next === "approvals") {
      setSearchParams({ tab: "approvals" }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const [services, setServices] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [categoryRows, setCategoryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sRes, cRes] = await Promise.all([
        listCatalogServices({ limit: 500, offset: 0 }),
        listCategoriesForServices({ purpose: "all" }),
      ]);
      setServices(sRes.items || []);
      const rows = cRes.items || [];
      setCategoryRows(rows);
      const cm = {};
      rows.forEach((c) => { cm[c.id] = c.name; });
      setCategoryMap(cm);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const subcategoryLabel = (categoryId) => {
    if (!categoryId) return "—";
    const c = categoryRows.find((x) => x.id === categoryId);
    if (!c) return categoryMap[categoryId] || "—";
    return c.name || "—";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      const sk = serviceStatusKey(s);
      if (statusTab === "pending" && sk !== "pending") return false;
      if (statusTab === "active" && sk !== "active") return false;
      if (statusTab === "rejected" && sk !== "rejected") return false;
      if (statusTab === "draft" && sk !== "draft") return false;
      if (fromDate) {
        const d = new Date(s.createdAt);
        if (Number.isNaN(d.getTime()) || d < new Date(fromDate)) return false;
      }
      if (toDate) {
        const d = new Date(s.createdAt);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (Number.isNaN(d.getTime()) || d > end) return false;
      }
      if (!q) return true;
      return (
        (s.name || "").toLowerCase().includes(q) ||
        subcategoryLabel(s.categoryId).toLowerCase().includes(q) ||
        serviceRef(s).toLowerCase().includes(q)
      );
    });
  }, [services, search, statusTab, fromDate, toDate, categoryMap, categoryRows]);

  const stats = useMemo(() => {
    const total = services.length;
    const activeCount = services.filter((s) => serviceStatusKey(s) === "active").length;
    const pendingCount = services.filter((s) => serviceStatusKey(s) === "pending").length;
    const priced = services.filter((s) => s.basePrice != null && String(s.basePrice).trim() !== "");
    const avgPrice = priced.length
      ? Math.round(priced.reduce((sum, s) => sum + Number(s.basePrice), 0) / priced.length)
      : 0;
    return { total, activeCount, pendingCount, avgPrice };
  }, [services]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await deleteCatalogService(id);
      if (modal?.id === id) setModal(null);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const statusPill = (srv) => {
    const sk = serviceStatusKey(srv);
    if (sk === "active") return { label: "Active", cls: "p4u-service-pill is-active" };
    if (sk === "pending") return { label: "Pending approval", cls: "p4u-service-pill is-pending" };
    if (sk === "draft") return { label: "Draft", cls: "p4u-service-pill is-draft" };
    if (sk === "rejected") return { label: "Rejected", cls: "p4u-service-pill is-inactive" };
    return { label: "Inactive", cls: "p4u-service-pill is-inactive" };
  };

  const exportCsv = () => {
    const rows = [
      ["ID", "Service", "Subcategory", "Price", "Duration", "Rating", "Status", "Created", "Updated"],
      ...filtered.map((s) => {
        const meta = parseMeta(s);
        const pill = statusPill(s);
        return [
          serviceRef(s),
          s.name || "",
          subcategoryLabel(s.categoryId),
          s.basePrice ?? "",
          s.duration || "",
          meta.rating ?? 0,
          pill.label,
          s.createdAt || "",
          s.updatedAt || "",
        ];
      }),
    ];
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `services-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (pageTab === "approvals") {
    return (
      <div className="p4u-services-page">
        <div className="p4u-services-main-tabs">
          <button type="button" onClick={() => selectPageTab("catalog")}>Services</button>
          <button type="button" className="is-active" onClick={() => selectPageTab("approvals")}>Services approvals</button>
        </div>
        <VendorServiceApprovalsLayer embedded />
      </div>
    );
  }

  return (
    <div className="p4u-services-page">
      <div className="p4u-services-main-tabs">
        <button type="button" className="is-active" onClick={() => selectPageTab("catalog")}>Services</button>
        <button type="button" onClick={() => selectPageTab("approvals")}>Services approvals</button>
      </div>

      <div className="p4u-services-hero">
        <h3>Services</h3>
        <p>{stats.total} services listed</p>
      </div>

      <div className="p4u-services-tabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={statusTab === t.key ? "is-active" : ""}
            onClick={() => setStatusTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p4u-services-stats">
        <div className="p4u-services-stat is-total">
          <span className="p4u-services-stat__icon"><Icon icon="mdi:wrench-outline" /></span>
          <div>
            <p className="p4u-services-stat__label">Total Services</p>
            <p className="p4u-services-stat__value">{stats.total}</p>
          </div>
        </div>
        <div className="p4u-services-stat is-active">
          <span className="p4u-services-stat__icon"><Icon icon="mdi:check-circle-outline" /></span>
          <div>
            <p className="p4u-services-stat__label">Active</p>
            <p className="p4u-services-stat__value">{stats.activeCount}</p>
          </div>
        </div>
        <div className="p4u-services-stat is-pending">
          <span className="p4u-services-stat__icon"><Icon icon="mdi:clock-outline" /></span>
          <div>
            <p className="p4u-services-stat__label">Pending Approval</p>
            <p className="p4u-services-stat__value">{stats.pendingCount}</p>
          </div>
        </div>
        <div className="p4u-services-stat is-price">
          <span className="p4u-services-stat__icon"><Icon icon="mdi:currency-inr" /></span>
          <div>
            <p className="p4u-services-stat__label">Avg Price</p>
            <p className="p4u-services-stat__value">₹{stats.avgPrice}</p>
          </div>
        </div>
      </div>

      <div className="p4u-services-toolbar">
        <label className="p4u-services-search">
          <Icon icon="mdi:magnify" className="text-secondary-light" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="p4u-services-date">
          <Icon icon="mdi:calendar-outline" />
          <span>From Date</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label className="p4u-services-date">
          <Icon icon="mdi:calendar-outline" />
          <span>To Date</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <div className="p4u-services-toolbar__actions">
          <button type="button" onClick={() => setModal({ mode: "add" })} className="p4u-services-btn-primary">
            <Icon icon="ic:baseline-plus" /> Add Service
          </button>
          <button type="button" onClick={exportCsv} className="p4u-services-btn-outline">
            <Icon icon="mdi:download-outline" /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      {loading ? (
        <p className="text-secondary-light mb-0">Loading services...</p>
      ) : (
        <div className="p4u-services-table-wrap">
          <table className="p4u-services-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 36 }} />
                <th scope="col">ID</th>
                <th scope="col">Service</th>
                <th scope="col">Vendor</th>
                <th scope="col">Price</th>
                <th scope="col">Duration</th>
                <th scope="col">Rating</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
                <th scope="col">Updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((srv) => {
                  const pill = statusPill(srv);
                  const meta = parseMeta(srv);
                  const price = srv.basePrice != null && String(srv.basePrice).trim() !== ""
                    ? `₹${Number(srv.basePrice).toLocaleString("en-IN")}`
                    : "—";
                  const rating = Number(meta.rating) || 0;
                  return (
                    <tr key={srv.id}>
                      <td>
                        <input type="checkbox" className="form-check-input" aria-label={`Select ${srv.name}`} readOnly />
                      </td>
                      <td>{serviceRef(srv)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {srv.iconUrl ? (
                            <img
                              src={resolveMediaUrl(srv.iconUrl)}
                              alt=""
                              className="p4u-services-thumb"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <span className="p4u-services-thumb d-inline-flex align-items-center justify-content-center text-secondary-light">
                              <Icon icon="mdi:image-outline" />
                            </span>
                          )}
                          <div>
                            <div className="service-name">{srv.name || "—"}</div>
                            <div className="service-meta">{subcategoryLabel(srv.categoryId)}</div>
                          </div>
                        </div>
                      </td>
                      <td>—</td>
                      <td className="fw-bold">{price}</td>
                      <td>{srv.duration || "—"}</td>
                      <td>
                        <span className="d-inline-flex align-items-center gap-1">
                          <Icon icon="mdi:star" style={{ color: "#f59e0b" }} /> {rating}
                        </span>
                      </td>
                      <td><span className={pill.cls}>{pill.label}</span></td>
                      <td>{formatServiceDateTime(srv.createdAt)}</td>
                      <td>{formatServiceDateTime(srv.updatedAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="p4u-services-action-btn"
                            onClick={() => setModal({ mode: "view", id: srv.id })}
                            aria-label="View"
                            title="View"
                          >
                            <Icon icon="majesticons:eye-line" />
                          </button>
                          <button
                            type="button"
                            className="p4u-services-action-btn"
                            onClick={() => setModal({ mode: "edit", id: srv.id })}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil-outline" />
                          </button>
                          <button
                            type="button"
                            className="p4u-services-action-btn is-danger"
                            onClick={() => handleDelete(srv.id)}
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Icon icon="mdi:trash-can-outline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={11} className="text-center py-4">No services found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormModal onClose={() => setModal(null)} size="xl">
          <ServiceFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            serviceId={modal.id}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
            onDelete={modal.mode === "edit" && modal.id ? () => handleDelete(modal.id) : undefined}
          />
        </FormModal>
      )}
    </div>
  );
};

export default ServiceListLayer;
