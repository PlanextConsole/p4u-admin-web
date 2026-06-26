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
  return PLAN_DOT_COLORS[key] || "#14b8a6";
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
    localCount: items.filter((i) => i.planType === "local").length,
    vipCount: items.filter((i) => i.planType === "vip").length,
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
    <>
      <div className="mb-24">
        <h3 className="fw-bold mb-4">Vendor Plans</h3>
        <p className="text-secondary-light text-sm mb-16">Configure marketplace vendor plans and pricing</p>
        <ul className="nav nav-pills gap-8 p-4 bg-neutral-100 radius-12 d-inline-flex mb-0">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link px-20 py-10 radius-8 border-0 ${activeTab === "local" ? "bg-white text-primary-light shadow-sm fw-semibold" : "bg-transparent text-secondary-light"}`}
              onClick={() => setActiveTab("local")}
            >
              Local Plans ({stats.localCount})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link px-20 py-10 radius-8 border-0 ${activeTab === "vip" ? "bg-white text-primary-light shadow-sm fw-semibold" : "bg-transparent text-secondary-light"}`}
              onClick={() => setActiveTab("vip")}
            >
              VIP Plans ({stats.vipCount})
            </button>
          </li>
        </ul>
      </div>

      <div className="card radius-12 p-0">
        <div className="card-body p-24">
          <div className="p4u-admin-filter-row gap-12 mb-20">
            <div className="input-group radius-8 p4u-filter-search" style={{ minWidth: 200, maxWidth: 360, flex: "1 1 240px" }}>
              <span className="input-group-text bg-white border-end-0"><Icon icon="mdi:magnify" /></span>
              <input
                type="search"
                className="form-control border-start-0 h-40-px"
                placeholder="Search plans…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="p4u-admin-filter-row__end">
              <button
                type="button"
                className="btn btn-primary radius-8 d-flex align-items-center gap-8 h-40-px px-16"
                onClick={() => setModal({ mode: "add", planType: activeTab })}
              >
                <Icon icon="mdi:plus" className="text-lg" />
                Add {tabLabel} Plan
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

          {loading ? (
            <p className="text-secondary-light mb-0">Loading plans…</p>
          ) : (
            <>
              <div className="table-responsive scroll-sm" style={{ overflowX: "auto" }}>
                <table className="table bordered-table sm-table mb-0 text-nowrap align-middle" style={{ minWidth: 1100 }}>
                  <thead>
                    <tr>
                      <th>PLAN</th>
                      <th>PRICE</th>
                      <th>VALIDITY</th>
                      <th>VISIBILITY</th>
                      <th>VENDOR TO P4U COMMISSION</th>
                      <th>MAX USER REDEMPTION %</th>
                      <th>PAYMENT</th>
                      <th>PROMOTIONS</th>
                      <th>STATUS</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.length === 0 ? (
                      <tr><td colSpan="10" className="text-center py-40 text-secondary-light">No plans found.</td></tr>
                    ) : (
                      pageSlice.map((row) => {
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
                                  <div className="fw-semibold">{row.planName}</div>
                                  {row.description && (
                                    <div className="text-secondary-light text-xs mt-4" style={{ maxWidth: 280 }}>
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
                              <span className="px-10 py-4 radius-pill text-xs bg-neutral-100 text-secondary-light text-capitalize">
                                {row.paymentMode || "both"}
                              </span>
                            </td>
                            <td>
                              {promos.length === 0 ? (
                                <span className="text-secondary-light text-sm">None</span>
                              ) : (
                                <div className="d-flex flex-wrap gap-6">
                                  {promos.map((p) => (
                                    <span key={p} className="px-10 py-4 radius-pill text-xs bg-neutral-100 text-secondary-light">{p}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`px-12 py-4 radius-pill text-xs fw-medium ${row.isActive ? "bg-success-100 text-success-700" : "bg-danger-100 text-danger-700"}`}>
                                {row.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center justify-content-end gap-12">
                                <button type="button" className="btn btn-link p-0 text-primary-600 text-sm fw-medium text-decoration-none" onClick={() => setModal({ mode: "edit", item: row })}>
                                  Edit
                                </button>
                                <button type="button" className="btn btn-link p-0 text-danger-600 text-sm fw-medium text-decoration-none" onClick={() => void handleDelete(row)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p4u-admin-filter-row align-items-center justify-content-between gap-2 mt-24">
                <span className="text-secondary-light text-sm">
                  Showing {pageFrom}–{pageTo} of {filtered.length}
                </span>
                <div className="d-flex gap-2 align-items-center">
                  <button
                    type="button"
                    className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 h-32-px text-md d-flex align-items-center justify-content-center"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <Icon icon="ep:d-arrow-left" />
                  </button>
                  <span className="page-link fw-semibold radius-8 border-0 h-32-px w-32-px text-md bg-primary-600 text-white d-flex align-items-center justify-content-center mb-0">
                    {safePage}
                  </span>
                  <button
                    type="button"
                    className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 h-32-px text-md d-flex align-items-center justify-content-center"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    <Icon icon="ep:d-arrow-right" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
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
    </>
  );
};

export default VendorPlanListLayer;
