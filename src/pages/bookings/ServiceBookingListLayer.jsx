import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { ApiError } from "../../lib/api/client";
import {
  getCatalogService,
  getCustomer,
  getVendor,
  listServiceBookings,
  deleteServiceBooking,
  updateServiceBookingStatus,
} from "../../lib/api/adminApi";
import { TableActionCell, TableActionHeader } from "../../components/admin/TableActionButtons";
import ServiceBookingDetailModal from "./ServiceBookingDetailModal";

const STATUS_OPTIONS = [
  { value: "", label: "Status" },
  { value: "pending", label: "Placed" },
  { value: "approved", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

const ACTIVE_STATUSES = new Set(["pending", "approved", "in_progress"]);
const COMPLETED_STATUSES = new Set(["completed"]);
const FETCH_LIMIT = 100;
const MAX_ROWS = 4000;
const PAGE_SIZE = 20;

function parseMeta(m) {
  if (m == null) return {};
  if (typeof m === "string") {
    try { return JSON.parse(m) || {}; } catch { return {}; }
  }
  return typeof m === "object" && !Array.isArray(m) ? m : {};
}

function displayRef(prefix, id, metaKey, meta) {
  const fromMeta = meta?.[metaKey];
  if (fromMeta && String(fromMeta).trim()) return String(fromMeta).trim();
  if (!id) return "—";
  const hex = String(id).replace(/-/g, "");
  const n = parseInt(hex.slice(0, 8), 16) % 10000000;
  return `${prefix}${String(n).padStart(7, "0")}`;
}

function bookingOrderRef(row) {
  const meta = parseMeta(row.metadata);
  return meta.orderRef || meta.displayId || meta.bookingRef || displayRef("ORD", row.id, "orderRef", meta);
}

function statusPill(status) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { cls: "bg-success-100 text-success-700", label: "Delivered" };
  if (s === "cancelled" || s === "rejected") return { cls: "bg-danger-100 text-danger-700", label: "Cancelled" };
  if (s === "pending") return { cls: "bg-warning-100 text-warning-700", label: "Placed" };
  if (s === "approved") return { cls: "bg-info-100 text-info-700", label: "Accepted" };
  if (s === "in_progress") return { cls: "bg-warning-100 text-warning-700", label: "In Progress" };
  return { cls: "bg-info-100 text-info-700", label: (status || "—").replace(/_/g, " ") };
}

function formatTs(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMoney(n) {
  const x = Number(n) || 0;
  return `₹${x.toLocaleString("en-IN", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function startOfLocalDay(ymd) {
  if (!ymd) return null;
  const parts = ymd.split("-").map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

function endOfLocalDay(ymd) {
  if (!ymd) return null;
  const parts = ymd.split("-").map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
}

function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

async function fetchAllBookings() {
  const all = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && all.length < MAX_ROWS) {
    const res = await listServiceBookings({ limit: FETCH_LIMIT, offset });
    const items = res?.data?.items ?? res?.items ?? [];
    all.push(...items);
    total = Number(res?.data?.total ?? res?.total ?? all.length);
    offset += items.length;
    if (items.length === 0) break;
  }
  return all;
}

export default function ServiceBookingListLayer() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [modal, setModal] = useState(null);
  const [customerCache, setCustomerCache] = useState({});
  const [vendorCache, setVendorCache] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const bookings = await fetchAllBookings();
      const normalized = bookings.map((r) => ({
        ...r,
        date: r.bookingDate ?? r.booking_date ?? "",
        slot: r.timeSlot ?? r.time_slot ?? "",
      }));
      setRows(normalized);

      const customerIds = [...new Set(normalized.map((r) => String(r.customerId || "").trim()).filter(Boolean))];
      const vendorIds = [...new Set(normalized.map((r) => String(r.vendorId || "").trim()).filter(Boolean))];
      const serviceIds = [...new Set(normalized.map((r) => String(r.serviceId || "").trim()).filter(Boolean))];

      const [customers, vendors, services] = await Promise.all([
        Promise.all(
          customerIds.map(async (id) => {
            try {
              const c = await getCustomer(id);
              const meta = parseMeta(c?.metadata);
              return [id, {
                name: c?.fullName || c?.name || "—",
                ref: meta.customerRef || displayRef("CUST", id, "customerRef", meta),
              }];
            } catch {
              return [id, { name: "—", ref: displayRef("CUST", id) }];
            }
          }),
        ),
        Promise.all(
          vendorIds.map(async (id) => {
            try {
              const v = await getVendor(id);
              return [id, {
                name: v?.businessName || v?.ownerName || "Unknown vendor",
                ref: v?.vendorRef || displayRef("VEND", id),
              }];
            } catch {
              return [id, { name: "Unknown vendor", ref: displayRef("VEND", id) }];
            }
          }),
        ),
        Promise.all(
          serviceIds.map(async (id) => {
            try {
              const s = await getCatalogService(id);
              return [id, s?.name || "Service"];
            } catch {
              return [id, "Service"];
            }
          }),
        ),
      ]);

      setCustomerCache(Object.fromEntries(customers));
      setVendorCache(Object.fromEntries(vendors));
      const serviceMap = Object.fromEntries(services);
      setRows((prev) => prev.map((r) => ({
        ...r,
        serviceLabel: serviceMap[String(r.serviceId || "").trim()] || parseMeta(r.metadata).serviceName || "—",
      })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const enriched = useMemo(() => rows.map((row) => {
    const cid = String(row.customerId || "").trim();
    const vid = String(row.vendorId || "").trim();
    const cust = customerCache[cid] || { name: "—", ref: cid ? displayRef("CUST", cid) : "—" };
    const vend = vendorCache[vid] || { name: "Unknown vendor", ref: vid ? displayRef("VEND", vid) : "—" };
    const meta = parseMeta(row.metadata);
    const itemCount = meta.itemCount ?? meta.itemsCount ?? (row.serviceId ? 1 : 0);
    return {
      row,
      orderRef: bookingOrderRef(row),
      customerName: meta.customerName || cust.name,
      customerRef: cust.ref,
      vendorName: meta.vendorName || vend.name,
      vendorRef: vend.ref,
      itemCount: Number(itemCount) || 0,
      total: Number(row.totalAmount ?? meta.totalAmount ?? 0) || 0,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }), [rows, customerCache, vendorCache]);

  const filtered = useMemo(() => {
    const rangeStart = fromDate ? startOfLocalDay(fromDate) : null;
    const rangeEnd = toDate ? endOfLocalDay(toDate) : null;
    return enriched.filter((r) => {
      const s = String(r.status || "").toLowerCase();
      if (statusFilter && s !== statusFilter) return false;
      const created = new Date(r.createdAt);
      if (!isNaN(created.getTime())) {
        if (rangeStart && created < rangeStart) return false;
        if (rangeEnd && created > rangeEnd) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          r.orderRef.toLowerCase().includes(q)
          || r.customerName.toLowerCase().includes(q)
          || r.customerRef.toLowerCase().includes(q)
          || r.vendorName.toLowerCase().includes(q)
          || r.vendorRef.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enriched, statusFilter, fromDate, toDate, search]);

  const stats = useMemo(() => {
    let revenue = 0;
    let active = 0;
    let completed = 0;
    filtered.forEach((r) => {
      revenue += r.total;
      const s = String(r.status || "").toLowerCase();
      if (ACTIVE_STATUSES.has(s)) active += 1;
      if (COMPLETED_STATUSES.has(s)) completed += 1;
    });
    return { total: filtered.length, revenue, active, completed };
  }, [filtered]);

  useEffect(() => { setPage(1); }, [search, statusFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const pageFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  const toggleAll = () => {
    if (selected.size === pageSlice.length) setSelected(new Set());
    else setSelected(new Set(pageSlice.map((r) => r.row.id)));
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cancelBooking = async (r) => {
    if (!window.confirm(`Cancel booking ${r.orderRef}?`)) return;
    try {
      await updateServiceBookingStatus(r.row.id, { status: "cancelled" });
      setRows((prev) => prev.map((row) => (row.id === r.row.id ? { ...row, status: "cancelled" } : row)));
      toast.success("Booking cancelled.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const removeBooking = async (r) => {
    if (!window.confirm(`Delete booking ${r.orderRef} permanently?`)) return;
    try {
      await deleteServiceBooking(r.row.id);
      setRows((prev) => prev.filter((row) => row.id !== r.row.id));
      toast.success("Booking deleted.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const exportCsv = () => {
    const header = ["Order ID", "Customer", "Customer Ref", "Vendor", "Vendor Ref", "Items", "Total", "Status", "Created", "Updated"];
    const lines = filtered.map((r) => [
      r.orderRef,
      r.customerName,
      r.customerRef,
      r.vendorName,
      r.vendorRef,
      r.itemCount || "—",
      r.total,
      r.status,
      formatTs(r.createdAt),
      formatTs(r.updatedAt),
    ]);
    const csv = toCsv([header, ...lines]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openModal = (r, mode) => {
    setModal({
      booking: { ...r.row, serviceLabel: r.row.serviceLabel },
      orderRef: r.orderRef,
      customerName: r.customerName,
      customerRef: r.customerRef,
      vendorName: r.vendorName,
      vendorRef: r.vendorRef,
      mode,
    });
  };

  return (
    <div>
      <div className="mb-24">
        <h3 className="fw-bold mb-4">Service Bookings</h3>
        <span className="text-secondary-light text-sm">
          {stats.total} service orders · Search by order ID, customer, vendor…
        </span>
      </div>

      <div className="row g-16 mb-24">
        <StatCard title="Service Orders" value={stats.total} icon="mdi:wrench-outline" cardCls="bg-success-50" iconCls="bg-success-100 text-success-600" valueCls="text-success-600" />
        <StatCard title="Revenue (page)" value={formatMoney(stats.revenue)} icon="mdi:currency-inr" cardCls="bg-info-50" iconCls="bg-info-100 text-info-600" valueCls="text-info-600" />
        <StatCard title="Active" value={stats.active} icon="mdi:clock-outline" cardCls="bg-warning-50" iconCls="bg-warning-100 text-warning-600" valueCls="text-warning-600" />
        <StatCard title="Completed" value={stats.completed} icon="mdi:check-circle-outline" cardCls="bg-primary-50" iconCls="bg-primary-100 text-primary-600" valueCls="text-primary-600" />
      </div>

      <div className="card radius-12 p-0">
        <div className="card-body p-24">
          <div className="p4u-admin-filter-row gap-12 mb-20">
            <div className="input-group radius-8 p4u-filter-search" style={{ minWidth: 200, maxWidth: 380, flex: "1 1 260px" }}>
              <span className="input-group-text bg-white border-end-0"><Icon icon="mdi:magnify" /></span>
              <input
                type="search"
                className="form-control border-start-0 h-40-px"
                placeholder="Search by order ID, customer, vendor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
            <select className="form-select radius-8 h-40-px" style={{ minWidth: 120, maxWidth: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (<option key={s.value || "all"} value={s.value}>{s.label}</option>))}
            </select>
            <input type="date" className="form-control radius-8 h-40-px" style={{ minWidth: 140, maxWidth: 170 }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="From Date" />
            <input type="date" className="form-control radius-8 h-40-px" style={{ minWidth: 140, maxWidth: 170 }} value={toDate} onChange={(e) => setToDate(e.target.value)} title="To Date" />
            <div className="p4u-admin-filter-row__end gap-8">
              <button type="button" className="btn btn-outline-secondary radius-8 d-flex align-items-center gap-8 h-40-px" onClick={exportCsv}>
                <Icon icon="mdi:download-outline" /> Export CSV
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

          {loading ? (
            <p className="text-secondary-light mb-0">Loading bookings…</p>
          ) : (
            <>
              <div className="table-responsive scroll-sm" style={{ overflowX: "auto" }}>
                <table className="table bordered-table sm-table mb-0 text-nowrap align-middle" style={{ minWidth: 1200 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={pageSlice.length > 0 && selected.size === pageSlice.length}
                          onChange={toggleAll}
                          aria-label="Select all on page"
                        />
                      </th>
                      <th>ORDER ID</th>
                      <th>CUSTOMER</th>
                      <th>VENDOR</th>
                      <th>ITEMS</th>
                      <th>TOTAL</th>
                      <th>STATUS</th>
                      <th>CREATED</th>
                      <th>UPDATED</th>
                      <TableActionHeader />
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.length === 0 ? (
                      <tr><td colSpan="10" className="text-center py-40 text-secondary-light">No bookings found.</td></tr>
                    ) : (
                      pageSlice.map((r) => {
                        const pill = statusPill(r.status);
                        const isTerminal = ["cancelled", "rejected", "completed"].includes(String(r.status).toLowerCase());
                        return (
                          <tr key={r.row.id}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selected.has(r.row.id)}
                                onChange={() => toggleOne(r.row.id)}
                                aria-label={`Select ${r.orderRef}`}
                              />
                            </td>
                            <td className="fw-semibold">{r.orderRef}</td>
                            <td>
                              <div className="fw-semibold">{r.customerName}</div>
                              <div className="text-secondary-light text-xs">{r.customerRef}</div>
                            </td>
                            <td>
                              <div>{r.vendorName} ({r.vendorRef})</div>
                              <div className="text-secondary-light text-xs">{r.vendorRef}</div>
                            </td>
                            <td>{r.itemCount > 0 ? r.itemCount : "—"}</td>
                            <td className="fw-semibold">{formatMoney(r.total)}</td>
                            <td><span className={`px-12 py-4 radius-pill text-xs fw-medium ${pill.cls}`}>{pill.label}</span></td>
                            <td>{formatTs(r.createdAt)}</td>
                            <td>{formatTs(r.updatedAt)}</td>
                            <TableActionCell
                              actions={[
                                { type: "view", onClick: () => openModal(r, "view") },
                                { type: "edit", onClick: () => openModal(r, "edit") },
                                {
                                  type: "cancel",
                                  icon: "mdi:cancel",
                                  title: "Cancel booking",
                                  hidden: isTerminal,
                                  onClick: () => void cancelBooking(r),
                                },
                                { type: "delete", onClick: () => void removeBooking(r) },
                              ]}
                            />
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
        <ServiceBookingDetailModal
          booking={modal.booking}
          orderRef={modal.orderRef}
          customerName={modal.customerName}
          customerRef={modal.customerRef}
          vendorName={modal.vendorName}
          vendorRef={modal.vendorRef}
          initialMode={modal.mode}
          onClose={() => setModal(null)}
          onSaved={(updated) => {
            setRows((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, iconCls, cardCls = "", valueCls = "" }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className={`radius-12 p-16 ${cardCls}`}>
        <div className="d-flex align-items-center gap-12">
          <span className={`w-40-px h-40-px radius-8 d-flex align-items-center justify-content-center ${iconCls}`}>
            <Icon icon={icon} className="text-xl" />
          </span>
          <div>
            <div className="text-secondary-light text-sm">{title}</div>
            <div className={`h5 fw-bold mb-0 ${valueCls}`}>{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
