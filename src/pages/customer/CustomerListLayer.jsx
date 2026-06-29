import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { createCustomer, listCustomers, listOccupations } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";
import CustomerFormLayer from "./CustomerFormLayer";

const STATUS_OPTIONS = ["All", "active", "inactive", "suspended"];
const STATUS_TABS = [
  { key: "all", label: "All Customers" },
  { key: "deactivated", label: "Deactivated" },
  { key: "deleted", label: "Deleted" },
];

const CustomerListLayer = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [occupationMap, setOccupationMap] = useState({});
  const [occupations, setOccupations] = useState([]);
  const [occupationFilter, setOccupationFilter] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    listOccupations({ purpose: "all" }).then((res) => {
      const items = res.items || [];
      const om = {};
      items.forEach((o) => {
        om[o.id] = o.name;
      });
      setOccupationMap(om);
      setOccupations(items);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCustomers({ limit, offset });
      setCustomers(res.items || []);
      setTotal(typeof res.total === "number" ? res.total : 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => {
    const s = String(c.status || "").toLowerCase();
    if (statusTab === "deactivated" && !["inactive", "suspended", "deactivated"].includes(s)) return false;
    if (statusTab === "deleted" && s !== "deleted") return false;
    if (statusFilter !== "All" && (c.status || "").toLowerCase() !== statusFilter) return false;
    if (occupationFilter) {
      const oid = c.occupationId != null ? String(c.occupationId) : "";
      if (oid !== occupationFilter) return false;
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (new Date(c.createdAt) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(c.createdAt) > to) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (c.fullName || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    const day = dt.toLocaleString("en-IN", { day: "numeric" });
    const mon = dt.toLocaleString("en-IN", { month: "short" });
    const yr = String(dt.getFullYear()).slice(-2);
    const time = dt.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${day} ${mon} ${yr}, ${time}`;
  };

  const customerRef = (id) => {
    const raw = String(id || "").replace(/-/g, "").toUpperCase();
    return raw ? `CUST-${raw.slice(0, 8)}` : "—";
  };

  const statusPill = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "active") return { label: "Active", cls: "p4u-customer-pill is-active" };
    const label = status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : "—";
    return { label, cls: "p4u-customer-pill is-inactive" };
  };

  const exportCsv = useCallback(() => {
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [
      ["Name", "Mobile", "Join Date", "Status", "Occupation", "Wallet", "Referral Code"],
      ...filtered.map((c) => {
        const meta = c.metadata || {};
        return [
          c.fullName || "",
          c.phone || "",
          formatDate(c.createdAt),
          c.status || "",
          occupationMap[c.occupationId] || meta.occupation || "",
          String(meta.wallet ?? meta.walletBalance ?? ""),
          meta.referralCode || "",
        ];
      }),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, occupationMap]);

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + customers.length;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;
  const deactivatedCount = customers.filter((c) =>
    ["inactive", "suspended", "deactivated"].includes(String(c.status || "").toLowerCase())
  ).length;
  const deletedCount = customers.filter((c) => String(c.status || "").toLowerCase() === "deleted").length;
  const activeCount = customers.filter((c) => String(c.status || "").toLowerCase() === "active").length;
  const inactiveSuspendedCount = customers.filter((c) =>
    ["inactive", "suspended", "deactivated"].includes(String(c.status || "").toLowerCase())
  ).length;
  const totalWalletPoints = customers.reduce((sum, c) => {
    const meta = c.metadata || {};
    return sum + (Number(meta.wallet ?? meta.walletBalance ?? 0) || 0);
  }, 0);

  return (
    <div className="p4u-customers-page">
      <div className="p4u-customers-hero">
        <h3>Customers</h3>
        <p>{total.toLocaleString("en-IN")} registered customers</p>
      </div>

      <div className="p4u-customers-tabs">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === "deactivated" ? deactivatedCount : tab.key === "deleted" ? deletedCount : null;
          const active = statusTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={active ? "is-active" : ""}
              onClick={() => setStatusTab(tab.key)}
            >
              {tab.label}{count != null ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      <div className="p4u-customers-stats">
        <div className="p4u-customers-stat is-total">
          <span className="p4u-customers-stat__icon"><Icon icon="mdi:account-group-outline" /></span>
          <div>
            <p className="p4u-customers-stat__label">Total Customers</p>
            <p className="p4u-customers-stat__value">{total.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="p4u-customers-stat is-active">
          <span className="p4u-customers-stat__icon"><Icon icon="mdi:account-check-outline" /></span>
          <div>
            <p className="p4u-customers-stat__label">Active</p>
            <p className="p4u-customers-stat__value">{activeCount.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="p4u-customers-stat is-inactive">
          <span className="p4u-customers-stat__icon"><Icon icon="mdi:account-cancel-outline" /></span>
          <div>
            <p className="p4u-customers-stat__label">Inactive / Suspended</p>
            <p className="p4u-customers-stat__value">{inactiveSuspendedCount.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="p4u-customers-stat is-points">
          <span className="p4u-customers-stat__icon"><Icon icon="mdi:star-circle-outline" /></span>
          <div>
            <p className="p4u-customers-stat__label">Total Wallet Points</p>
            <p className="p4u-customers-stat__value">{totalWalletPoints.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      <div className="p4u-customers-toolbar">
        <label className="p4u-customers-search">
          <Icon icon="mdi:magnify" className="text-secondary-light" />
          <input
            type="text"
            placeholder="Search by name, email, mobile, occupation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === "All" ? "Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={occupationFilter} onChange={(e) => setOccupationFilter(e.target.value)} aria-label="Filter occupation">
          <option value="">Occupation</option>
          {occupations.map((o) => (
            <option key={o.id} value={String(o.id)}>{o.name || o.id}</option>
          ))}
        </select>
        <label className="p4u-customers-date">
          <Icon icon="mdi:calendar-outline" />
          <span>From Date</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="p4u-customers-date">
          <Icon icon="mdi:calendar-outline" />
          <span>To Date</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <div className="p4u-customers-toolbar__actions">
          <button
            type="button"
            className="p4u-customers-btn-primary"
            onClick={() => setModal({ mode: "add" })}
          >
            <Icon icon="ic:baseline-plus" /> Add Customer
          </button>
          <button type="button" className="p4u-customers-btn-outline" onClick={exportCsv}>
            <Icon icon="mdi:download-outline" /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}
      {loading ? (
        <p className="text-secondary-light mb-0">Loading customers...</p>
      ) : (
        <>
          <div className="p4u-customers-table-wrap">
            <table className="p4u-customers-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 36 }} />
                  <th scope="col">ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Mobile</th>
                  <th scope="col">Occupation</th>
                  <th scope="col">Points</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((customer) => {
                    const meta = customer.metadata || {};
                    const pill = statusPill(customer.status);
                    return (
                      <tr key={customer.id}>
                        <td>
                          <input type="checkbox" className="form-check-input" aria-label={`Select ${customer.fullName}`} readOnly />
                        </td>
                        <td>{customerRef(customer.id)}</td>
                        <td><span className="cust-name">{customer.fullName || "—"}</span></td>
                        <td>{customer.email || "—"}</td>
                        <td>{customer.phone || "—"}</td>
                        <td>{occupationMap[customer.occupationId] || meta.occupation || "—"}</td>
                        <td className="fw-semibold">{meta.wallet ?? meta.walletBalance ?? 0}</td>
                        <td><span className={pill.cls}>{pill.label}</span></td>
                        <td>{formatDate(customer.createdAt)}</td>
                        <td>{formatDate(customer.updatedAt)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="p4u-customers-action-btn"
                              onClick={() => setModal({ mode: "view", id: customer.id })}
                              aria-label="View"
                              title="View"
                            >
                              <Icon icon="majesticons:eye-line" />
                            </button>
                            <button
                              type="button"
                              className="p4u-customers-action-btn"
                              onClick={() => setModal({ mode: "edit", id: customer.id })}
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil-outline" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={11} className="text-center py-4">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p4u-customers-pagination">
            <div>
              <span>Showing {pageFrom} to {pageTo} of {total} entries</span>
              <span className="d-block mt-1 text-sm">
                <Link to="/occupations" className="text-primary-600">Occupations</Link>
                {" — edit the list used when assigning a customer's occupation."}
              </span>
            </div>
            <div className="p4u-customers-pagination__controls">
              <button type="button" disabled={!canPrev} onClick={() => setOffset(Math.max(0, offset - limit))} aria-label="Previous page">
                <Icon icon="ep:d-arrow-left" />
              </button>
              <span className="p4u-customers-pagination__page">{Math.floor(offset / limit) + 1}</span>
              <button type="button" disabled={!canNext} onClick={() => setOffset(offset + limit)} aria-label="Next page">
                <Icon icon="ep:d-arrow-right" />
              </button>
            </div>
          </div>
        </>
      )}

      {modal && modal.id && (
        <FormModal onClose={() => setModal(null)} size="xl">
          <CustomerFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            customerId={modal.id}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
      {modal && modal.mode === "add" && (
        <FormModal onClose={() => setModal(null)} size="lg">
          <CustomerCreateForm
            occupations={occupations}
            onSuccess={() => {
              setModal(null);
              load();
            }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

function CustomerCreateForm({ occupations, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    status: "active",
    occupationId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createCustomer({
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        status: form.status,
        occupationId: form.occupationId || null,
      });
      toast.success("Customer created.");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card h-100 p-0 radius-12 border-0 shadow-none">
      <div className="card-body p-24">
        <div className="d-flex align-items-center gap-12 mb-20">
          <span className="w-48-px h-48-px radius-12 bg-primary-600 text-white d-flex align-items-center justify-content-center flex-shrink-0">
            <Icon icon="mdi:plus" className="text-2xl" />
          </span>
          <h5 className="fw-bold mb-0">New Customer</h5>
        </div>
        <form onSubmit={submit}>
          <div className="row g-16">
            <div className="col-md-6">
              <label className="form-label fw-semibold text-sm">Full Name *</label>
              <input
                className="form-control radius-10"
                name="fullName"
                value={form.fullName}
                onChange={update}
                disabled={submitting}
                placeholder="Enter name"
                autoComplete="name"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-sm">Status</label>
              <select className="form-select radius-10" name="status" value={form.status} onChange={update} disabled={submitting}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-sm">Email *</label>
              <div className="input-group radius-10">
                <span className="input-group-text bg-base border-end-0 text-secondary-light">
                  <Icon icon="mdi:email-outline" />
                </span>
                <input
                  className="form-control border-start-0 radius-10"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={update}
                  disabled={submitting}
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-sm">Mobile</label>
              <div className="input-group radius-10">
                <span className="input-group-text bg-base border-end-0 text-secondary-light">
                  <Icon icon="mdi:phone-outline" />
                </span>
                <input
                  className="form-control border-start-0 radius-10"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={update}
                  disabled={submitting}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-sm">Occupation</label>
              <select className="form-select radius-10" name="occupationId" value={form.occupationId} onChange={update} disabled={submitting}>
                <option value="">Select occupation</option>
                {occupations.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-10 mt-24">
            <button type="button" className="btn btn-light border radius-10 px-20" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary radius-10 px-20" disabled={submitting}>
              {submitting ? "Creating…" : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerListLayer;
