import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import FormModal from "../../components/admin/FormModal";
import { deleteVendorPlan, listVendorPlans } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import VendorPlanFormLayer from "./VendorPlanFormLayer";

const PAGE_SIZE = 20;

const PLAN_DOT_COLORS = {
  basic: "#94a3b8",
  standard: "#3b82f6",
  premium: "#f59e0b",
  bronze: "#cd7f32",
  silver: "#9ca3af",
  gold: "#eab308",
  diamond: "#06b6d4",
  platinum: "#8b5cf6",
};

function planDotColor(name) {
  const key = String(name || "").toLowerCase().trim();
  return PLAN_DOT_COLORS[key] || "#0b7285";
}

const formatInr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function prettyVisibility(row) {
  const s = String(row.visibilityType || "").toLowerCase();
  if (s === "radius") {
    const km = row.radiusKm != null && row.radiusKm !== "" ? Number(row.radiusKm) : null;
    return km != null && !Number.isNaN(km) ? `Radius Based (${km}km)` : "Radius Based";
  }
  if (s === "city") return "City";
  if (s === "state") return "State";
  if (s === "country") return "Pan India";
  return "—";
}

function promoPills(row) {
  const pills = [];
  if (row.promoBannerAds) pills.push("Banner");
  if (row.promoVideoAds) pills.push("Video");
  if (row.promoPriorityListing) pills.push("Priority");
  return pills;
}

const VendorPlanListLayer = () => {
  const [activeTab, setActiveTab] = useState("local");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listVendorPlans({ limit: 200, offset: 0, includeInactive: true });
      setItems(res.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: items.length,
    localCount: items.filter((i) => i.planType === "local").length,
    vipCount: items.filter((i) => i.planType === "vip").length,
    activeCount: items.filter((i) => i.isActive).length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((r) => r.planType === activeTab)
      .filter((r) => {
        if (!q) return true;
        return (
          String(r.planName || "").toLowerCase().includes(q)
          || String(r.description || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(a.tier || 9999) - Number(b.tier || 9999));
  }, [activeTab, items, search]);

  useEffect(() => { setPage(1); }, [activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const pageFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(safePage * PAGE_SIZE, filtered.length);
  const tabLabel = activeTab === "vip" ? "VIP" : "Local";

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete plan "${row.planName}"?`)) return;
    try {
      await deleteVendorPlan(row.id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  return (
    <div className="p4u-vendors-page">
      <div className="p4u-vendors-hero">
        <div>
          <h3>Vendor Plans</h3>
          <p>{stats.total} plans · Local and VIP marketplace packages</p>
        </div>
      </div>

      <div className="p4u-vendors-tabs" role="tablist">
        <button type="button" className={activeTab === "local" ? "is-active" : ""} onClick={() => setActiveTab("local")}>
          Local Plans ({stats.localCount})
        </button>
        <button type="button" className={activeTab === "vip" ? "is-active" : ""} onClick={() => setActiveTab("vip")}>
          VIP Plans ({stats.vipCount})
        </button>
      </div>

      <div className="p4u-vendors-stats">
        <div className="p4u-vendors-stat is-total">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:clipboard-list-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Total Plans</p>
            <p className="p4u-vendors-stat__value">{stats.total}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-verified">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:check-decagram-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Active</p>
            <p className="p4u-vendors-stat__value">{stats.activeCount}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-pending">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:map-marker-radius-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Local</p>
            <p className="p4u-vendors-stat__value">{stats.localCount}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-rejected">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:crown-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">VIP</p>
            <p className="p4u-vendors-stat__value">{stats.vipCount}</p>
          </div>
        </div>
      </div>

      <div className="p4u-vendors-toolbar">
        <label className="p4u-vendors-search">
          <Icon icon="mdi:magnify" />
          <input
            type="search"
            placeholder="Search plans…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="p4u-vendors-toolbar__actions">
          <button
            type="button"
            className="p4u-vendors-btn-primary"
            onClick={() => setModal({ mode: "add", planType: activeTab })}
          >
            <Icon icon="mdi:plus" />
            Add {tabLabel} Plan
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      <div className="p4u-vendors-table-wrap">
        {loading ? (
          <p className="text-secondary-light mb-0 p-24">Loading plans…</p>
        ) : (
          <>
            <table className="p4u-vendors-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Validity</th>
                  <th>Visibility</th>
                  <th>Vendor → P4U Commission</th>
                  <th>Max User Redemption %</th>
                  <th>Payment</th>
                  <th>Promotions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-40 text-secondary-light">No plans found.</td></tr>
                ) : pageSlice.map((row) => {
                  const promos = promoPills(row);
                  const dot = planDotColor(row.planName);
                  return (
                    <tr key={row.id}>
                      <td style={{ minWidth: 200, whiteSpace: "normal" }}>
                        <div className="d-flex align-items-start gap-10">
                          <span
                            className="flex-shrink-0 radius-circle mt-6"
                            style={{ width: 10, height: 10, background: dot }}
                            aria-hidden
                          />
                          <div>
                            <div className="business-name">{row.planName}</div>
                            {row.description && (
                              <div className="business-owner">
                                {String(row.description).replace(/<[^>]+>/g, "").slice(0, 120)}
                                {String(row.description).length > 120 ? "…" : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="fw-medium">{formatInr(row.price)}</td>
                      <td>{row.validityDays} days</td>
                      <td>{prettyVisibility(row)}</td>
                      <td>{row.commissionPercent}%</td>
                      <td>{row.maxUserRedemptionPercent}%</td>
                      <td>
                        <span className="p4u-vendor-pill is-pending text-capitalize">{row.paymentMode || "both"}</span>
                      </td>
                      <td>
                        {promos.length === 0 ? (
                          <span className="text-secondary-light text-sm">None</span>
                        ) : (
                          <div className="d-flex flex-wrap gap-6">
                            {promos.map((p) => (
                              <span key={p} className="p4u-vendor-pill is-verified">{p}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`p4u-vendor-pill ${row.isActive ? "is-verified" : "is-rejected"}`}>
                          {row.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-8">
                          <button
                            type="button"
                            className="p4u-vendors-view-btn"
                            title="Edit"
                            onClick={() => setModal({ mode: "edit", item: row })}
                          >
                            <Icon icon="mdi:pencil-outline" />
                          </button>
                          <button
                            type="button"
                            className="p4u-vendors-view-btn"
                            title="Delete"
                            style={{ color: "#dc2626" }}
                            onClick={() => void handleDelete(row)}
                          >
                            <Icon icon="mdi:trash-can-outline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p4u-vendors-toolbar" style={{ marginTop: 16, marginBottom: 0 }}>
              <span className="text-secondary-light text-sm">
                Showing {pageFrom}–{pageTo} of {filtered.length}
              </span>
              <div className="p4u-vendors-toolbar__actions">
                <button
                  type="button"
                  className="p4u-vendors-btn-outline"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span className="p4u-vendor-pill is-verified">{safePage}</span>
                <button
                  type="button"
                  className="p4u-vendors-btn-outline"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="md">
          <VendorPlanFormLayer
            isEdit={modal.mode === "edit"}
            initialData={modal.mode === "edit" ? modal.item : { planType: modal.planType }}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default VendorPlanListLayer;
