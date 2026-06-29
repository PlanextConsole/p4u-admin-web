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
import {
  parseMeta,
  displayRef,
  formatTs,
  formatMoney,
  toCsv,
  serviceStatusPill,
} from "../orders/orderUiUtils";

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
const DELETED_STATUSES = new Set(["cancelled", "rejected"]);
const FETCH_LIMIT = 100;
const MAX_ROWS = 4000;
const PAGE_SIZE = 20;

function bookingOrderRef(row) {
  const meta = parseMeta(row.metadata);
  return meta.orderRef || meta.displayId || meta.bookingRef || displayRef("ORD", row.id, "orderRef", meta);
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

export default function ServiceBookingListLayer({ embedded = false, deletedOnly = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
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
    const itemsLabel = row.serviceLabel && row.serviceLabel !== "—" ? row.serviceLabel : "—";
    return {
      row,
      orderRef: bookingOrderRef(row),
      customerName: meta.customerName || cust.name,
      customerRef: cust.ref,
      vendorName: meta.vendorName || vend.name,
      vendorRef: vend.ref,
      itemsLabel,
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
      if (deletedOnly) {
        if (!DELETED_STATUSES.has(s)) return false;
      } else if (DELETED_STATUSES.has(s)) {
        return false;
      }
      if (statusFilter && s !== statusFilter) return false;
      const created = new Date(r.createdAt);
      if (!isNaN(created.getTime())) {
        if (rangeStart && created < rangeStart) return false;
        if (rangeEnd && created > rangeEnd) return false;
      }
      if (vendorFilter.trim()) {
        const q = vendorFilter.toLowerCase();
        if (!r.vendorName.toLowerCase().includes(q) && !r.vendorRef.toLowerCase().includes(q)) return false;
      }
      if (itemFilter.trim()) {
        const q = itemFilter.toLowerCase();
        if (!r.itemsLabel.toLowerCase().includes(q)) return false;
      }
      if (customerFilter.trim()) {
        const q = customerFilter.toLowerCase();
        if (!r.customerName.toLowerCase().includes(q) && !r.customerRef.toLowerCase().includes(q)) return false;
      }
      const min = minPrice !== "" ? Number(minPrice) : null;
      const max = maxPrice !== "" ? Number(maxPrice) : null;
      if (min != null && !Number.isNaN(min) && r.total < min) return false;
      if (max != null && !Number.isNaN(max) && r.total > max) return false;
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
  }, [enriched, deletedOnly, statusFilter, fromDate, toDate, search, vendorFilter, itemFilter, customerFilter, minPrice, maxPrice]);

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

  useEffect(() => { setPage(1); }, [search, statusFilter, fromDate, toDate, vendorFilter, itemFilter, customerFilter, minPrice, maxPrice, deletedOnly]);

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
      r.itemsLabel,
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
    a.download = `service-orders-${new Date().toISOString().slice(0, 10)}.csv`;
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

  const statTitle = deletedOnly ? "Deleted Service Orders" : "Service Orders";

  const content = (
    <>
      {!deletedOnly && (
        <div className="p4u-orders-stats">
          <div className="p4u-orders-stat is-total">
            <span className="p4u-orders-stat__icon"><Icon icon="mdi:wrench-outline" /></span>
            <div>
              <p className="p4u-orders-stat__label">{statTitle}</p>
              <p className="p4u-orders-stat__value">{stats.total.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="p4u-orders-stat is-revenue">
            <span className="p4u-orders-stat__icon"><Icon icon="mdi:currency-inr" /></span>
            <div>
              <p className="p4u-orders-stat__label">Revenue (page)</p>
              <p className="p4u-orders-stat__value">{formatMoney(stats.revenue)}</p>
            </div>
          </div>
          <div className="p4u-orders-stat is-active">
            <span className="p4u-orders-stat__icon"><Icon icon="mdi:clock-outline" /></span>
            <div>
              <p className="p4u-orders-stat__label">Active</p>
              <p className="p4u-orders-stat__value">{stats.active.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="p4u-orders-stat is-completed">
            <span className="p4u-orders-stat__icon"><Icon icon="mdi:check-circle-outline" /></span>
            <div>
              <p className="p4u-orders-stat__label">Completed</p>
              <p className="p4u-orders-stat__value">{stats.completed.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p4u-orders-advanced-filters">
        <input type="text" placeholder="Vendor (name / ID)…" value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} />
        <input type="text" placeholder="Service / item title…" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} />
        <input type="text" placeholder="Customer (name / ID)…" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} />
        <input type="number" placeholder="Min ₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} min="0" />
        <input type="number" placeholder="Max ₹" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} min="0" />
      </div>

      <div className="p4u-orders-toolbar">
        <label className="p4u-orders-search">
          <Icon icon="mdi:magnify" />
          <input
            type="search"
            placeholder="Search by order ID, customer, vendor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status">
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value || "all"} value={s.value}>{s.label}</option>
          ))}
        </select>
        <label className="p4u-orders-date">
          <Icon icon="mdi:calendar-outline" />
          <span>From Date</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label className="p4u-orders-date">
          <Icon icon="mdi:calendar-outline" />
          <span>To Date</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <div className="p4u-orders-toolbar__actions">
          <button type="button" className="p4u-orders-btn-outline" onClick={exportCsv}>
            <Icon icon="mdi:download-outline" /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      {loading ? (
        <p className="text-secondary-light mb-0">Loading bookings…</p>
      ) : (
        <>
          <div className="p4u-orders-table-wrap">
            <table className="p4u-orders-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={pageSlice.length > 0 && selected.size === pageSlice.length}
                      onChange={toggleAll}
                      aria-label="Select all on page"
                    />
                  </th>
                  <th scope="col">Order ID</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Vendor</th>
                  <th scope="col">Items</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Updated</th>
                  <TableActionHeader />
                </tr>
              </thead>
              <tbody>
                {pageSlice.length === 0 ? (
                  <tr><td colSpan="10" className="text-center py-40 text-secondary-light">No bookings found.</td></tr>
                ) : (
                  pageSlice.map((r) => {
                    const pill = serviceStatusPill(r.status);
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
                        <td><span className="order-ref">{r.orderRef}</span></td>
                        <td>
                          <div className="order-entity-name">{r.customerName}</div>
                          <div className="order-entity-ref">{r.customerRef}</div>
                        </td>
                        <td>
                          <div className="order-entity-name">{r.vendorName}</div>
                          <div className="order-entity-ref">{r.vendorRef}</div>
                        </td>
                        <td>{r.itemsLabel}</td>
                        <td className="order-total">{formatMoney(r.total)}</td>
                        <td><span className={pill.cls}>{pill.label}</span></td>
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

          <div className="p4u-orders-pagination">
            <span>Showing {pageFrom}–{pageTo} of {filtered.length}</span>
            <div className="p4u-orders-pagination__controls">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
                <Icon icon="ep:d-arrow-left" />
              </button>
              <span className="p4u-orders-pagination__page">{safePage}</span>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page">
                <Icon icon="ep:d-arrow-right" />
              </button>
            </div>
          </div>
        </>
      )}

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
    </>
  );

  if (embedded) return content;

  return (
    <div className="p4u-orders-page">
      <div className="p4u-orders-hero">
        <h3>Service Bookings</h3>
        <p>{stats.total} service orders</p>
      </div>
      {content}
    </div>
  );
}
