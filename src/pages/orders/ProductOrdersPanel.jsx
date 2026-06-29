import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { listOrders, listVendors, getCustomer, getVendor, updateOrder, getOrderStats } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import OrderDetailModal from "./OrderDetailModal";
import { TableActionCell, TableActionHeader } from "../../components/admin/TableActionButtons";
import {
  parseMeta,
  displayRef,
  formatTs,
  formatMoney,
  toCsv,
  orderItemsLabel,
  productStatusPill,
} from "./orderUiUtils";

const STATUS_OPTIONS = [
  { value: "", label: "Status" },
  { value: "placed", label: "Placed" },
  { value: "paid", label: "Paid" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES = new Set(["placed", "paid", "accepted", "in_progress", "delivered", "pending", "created", "order_await_completion"]);
const COMPLETED_STATUSES = new Set(["completed"]);
const DELETED_STATUSES = new Set(["cancelled", "canceled"]);

export default function ProductOrdersPanel({ deletedOnly = false }) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
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
  const [vendors, setVendors] = useState([]);
  const [customerById, setCustomerById] = useState({});
  const [vendorRefById, setVendorRefById] = useState({});
  const [modal, setModal] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    listVendors({ limit: 200, offset: 0 }).then((r) => setVendors(r.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    getOrderStats(params).then((s) => setGlobalStats(s)).catch(() => setGlobalStats(null));
  }, [statusFilter, fromDate, toDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listOrders({ limit, offset });
      setOrders(res.items || []);
      setTotal(typeof res.total === "number" ? res.total : 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!orders.length) return;
    let cancelled = false;
    const customerIds = [...new Set(orders.map((o) => o.customerId).filter(Boolean))];
    const vendorIds = [...new Set(orders.map((o) => o.vendorId).filter(Boolean))];

    const pendingCustomers = customerIds.filter((id) => !(id in customerById));
    const pendingVendors = vendorIds.filter((id) => !(id in vendorRefById));

    if (pendingCustomers.length) {
      Promise.all(
        pendingCustomers.map((id) =>
          getCustomer(id)
            .then((c) => {
              const meta = parseMeta(c?.metadata);
              return [id, {
                fullName: c?.fullName ?? c?.full_name ?? "",
                phone: c?.phone ?? "",
                ref: meta.customerRef || displayRef("CUST", id, "customerRef", meta),
              }];
            })
            .catch(() => [id, { fullName: "", phone: "", ref: displayRef("CUST", id) }]),
        ),
      ).then((pairs) => {
        if (!cancelled) setCustomerById((p) => ({ ...p, ...Object.fromEntries(pairs) }));
      });
    }

    if (pendingVendors.length) {
      Promise.all(
        pendingVendors.map((id) =>
          getVendor(id)
            .then((v) => [id, v?.vendorRef || displayRef("VEND", id)])
            .catch(() => [id, displayRef("VEND", id)]),
        ),
      ).then((pairs) => {
        if (!cancelled) setVendorRefById((p) => ({ ...p, ...Object.fromEntries(pairs) }));
      });
    }

    return () => { cancelled = true; };
  }, [orders, customerById, vendorRefById]);

  const vendorMap = useMemo(() => {
    const m = {};
    vendors.forEach((v) => { m[v.id] = v.businessName || v.ownerName || "Vendor"; });
    return m;
  }, [vendors]);

  const enriched = useMemo(() => orders.map((o) => {
    const meta = parseMeta(o.metadata);
    const cached = o.customerId ? customerById[o.customerId] : null;
    const customerName = meta.customerName || meta.customer_name || cached?.fullName || "—";
    const customerRef = cached?.ref || displayRef("CUST", o.customerId);
    const vendorName = vendorMap[o.vendorId] || meta.vendorName || "—";
    const vendorRef = vendorRefById[o.vendorId] || displayRef("VEND", o.vendorId);
    const totalAmt = Number(o.totalAmount || 0) || 0;
    return {
      order: o,
      meta,
      customerName,
      customerRef,
      vendorName,
      vendorRef,
      itemsLabel: orderItemsLabel(meta),
      total: totalAmt,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }), [orders, customerById, vendorRefById, vendorMap]);

  const filtered = useMemo(() => enriched.filter((r) => {
    const s = (r.status || "").toLowerCase();
    if (deletedOnly) {
      if (!DELETED_STATUSES.has(s)) return false;
    } else if (DELETED_STATUSES.has(s)) {
      return false;
    }
    if (statusFilter && s !== statusFilter) return false;
    if (fromDate) {
      const d = new Date(r.createdAt);
      if (isNaN(d) || d < new Date(fromDate)) return false;
    }
    if (toDate) {
      const d = new Date(r.createdAt);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      if (isNaN(d) || d > end) return false;
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
      const q = search.toLowerCase();
      const phone = r.meta.customerPhone || r.meta.customer_phone || customerById[r.order.customerId]?.phone || "";
      return (
        (r.order.orderRef || "").toLowerCase().includes(q)
        || r.customerName.toLowerCase().includes(q)
        || r.vendorName.toLowerCase().includes(q)
        || phone.includes(q)
      );
    }
    return true;
  }), [enriched, deletedOnly, statusFilter, fromDate, toDate, vendorFilter, itemFilter, customerFilter, minPrice, maxPrice, search, customerById]);

  const stats = useMemo(() => {
    if (!deletedOnly && globalStats && typeof globalStats.total === "number") {
      return {
        total: globalStats.total,
        revenue: Number(globalStats.revenue || 0),
        active: Number(globalStats.active || 0),
        completed: Number(globalStats.completed || 0),
      };
    }
    let revenue = 0;
    let active = 0;
    let completed = 0;
    filtered.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      revenue += r.total;
      if (ACTIVE_STATUSES.has(s)) active += 1;
      if (COMPLETED_STATUSES.has(s)) completed += 1;
    });
    return { total: filtered.length, revenue, active, completed };
  }, [filtered, globalStats, deletedOnly]);

  const cancel = async (r) => {
    if (!window.confirm(`Cancel order ${r.order.orderRef || r.order.id}?`)) return;
    try {
      const updated = await updateOrder(r.order.id, { status: "cancelled" });
      setOrders((prev) => prev.map((row) => (row.id === r.order.id ? { ...row, ...updated } : row)));
      toast.success("Order cancelled.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const exportCsv = () => {
    const header = ["Order ID", "Customer", "Customer Ref", "Vendor", "Vendor Ref", "Items", "Total", "Status", "Created", "Updated"];
    const lines = filtered.map((r) => [
      r.order.orderRef || r.order.id,
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
    a.download = `product-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + orders.length;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.order.id)));
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statTitle = deletedOnly ? "Deleted Orders" : "Product Orders";

  return (
    <>
      <div className="p4u-orders-stats">
        <div className="p4u-orders-stat is-total">
          <span className="p4u-orders-stat__icon"><Icon icon="mdi:package-variant-closed" /></span>
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

      <div className="p4u-orders-advanced-filters">
        <input type="text" placeholder="Vendor (name / ID)…" value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} />
        <input type="text" placeholder="Product / item title…" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} />
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
        <p className="text-secondary-light mb-0">Loading orders…</p>
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
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                      aria-label="Select all"
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
                {filtered.length === 0 ? (
                  <tr><td colSpan="10" className="text-center py-40 text-secondary-light">No orders found.</td></tr>
                ) : (
                  filtered.map((r) => {
                    const pill = productStatusPill(r.status);
                    const isCancelled = DELETED_STATUSES.has((r.status || "").toLowerCase());
                    return (
                      <tr key={r.order.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selected.has(r.order.id)}
                            onChange={() => toggleOne(r.order.id)}
                            aria-label={`Select ${r.order.orderRef}`}
                          />
                        </td>
                        <td><span className="order-ref">{r.order.orderRef || "—"}</span></td>
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
                            {
                              type: "view",
                              onClick: () => setModal({
                                orderId: r.order.id,
                                mode: "view",
                                customerName: r.customerName,
                                vendorName: r.vendorName,
                              }),
                            },
                            {
                              type: "edit",
                              onClick: () => setModal({
                                orderId: r.order.id,
                                mode: "edit",
                                customerName: r.customerName,
                                vendorName: r.vendorName,
                              }),
                            },
                            {
                              type: "cancel",
                              icon: "mdi:cancel",
                              title: "Cancel order",
                              hidden: isCancelled,
                              onClick: () => void cancel(r),
                            },
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
            <span>Showing {pageFrom}–{pageTo} of {total}</span>
            <div className="p4u-orders-pagination__controls">
              <button type="button" disabled={!canPrev} onClick={() => setOffset(Math.max(0, offset - limit))} aria-label="Previous page">
                <Icon icon="ep:d-arrow-left" />
              </button>
              <span className="p4u-orders-pagination__page">{Math.floor(offset / limit) + 1}</span>
              <button type="button" disabled={!canNext} onClick={() => setOffset(offset + limit)} aria-label="Next page">
                <Icon icon="ep:d-arrow-right" />
              </button>
            </div>
          </div>
        </>
      )}

      {modal && (
        <OrderDetailModal
          orderId={modal.orderId}
          initialMode={modal.mode}
          customerName={modal.customerName}
          vendorName={modal.vendorName}
          onClose={() => setModal(null)}
          onSaved={(row) => setOrders((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...row } : r)))}
        />
      )}
    </>
  );
}
