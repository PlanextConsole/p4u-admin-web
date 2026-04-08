import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { listOrders, listVendors, getCustomer } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const STATUS_OPTIONS = ["All Status", "pending", "completed", "cancelled", "created", "order_await_completion"];

/** MySQL/TypeORM sometimes returns `metadata` as a JSON string; list rows must match view-order parsing. */
function orderMetadata(order) {
  let m = order?.metadata;
  if (m == null) return {};
  if (typeof m === "string") {
    try {
      m = JSON.parse(m);
    } catch {
      return {};
    }
  }
  return m && typeof m === "object" && !Array.isArray(m) ? m : {};
}
const DATE_OPTIONS = ["All Dates", "Today", "This Week", "This Month", "This Year"];

const OrderListLayer = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [vendorFilter, setVendorFilter] = useState("All Vendors");
  const [vendors, setVendors] = useState([]);
  /** customerId -> { fullName, phone } | null (fetched when snapshot missing on list payload) */
  const [customerById, setCustomerById] = useState({});

  useEffect(() => {
    listVendors({ limit: 200, offset: 0 }).then((r) => setVendors(r.items || [])).catch(() => {});
  }, []);

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

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!orders.length) return;
    let cancelled = false;
    const ids = [...new Set(orders.map((o) => o.customerId).filter(Boolean))];

    setCustomerById((prev) => {
      const pending = ids.filter((id) => !(id in prev));
      if (!pending.length) return prev;

      Promise.all(
        pending.map((id) =>
          getCustomer(id)
            .then((c) => [
              id,
              c
                ? {
                    fullName: c.fullName ?? c.full_name ?? "",
                    phone: c.phone ?? "",
                  }
                : null,
            ])
            .catch(() => [id, null]),
        ),
      ).then((pairs) => {
        if (cancelled) return;
        const batch = Object.fromEntries(pairs);
        setCustomerById((p) => ({ ...p, ...batch }));
      });

      return prev;
    });

    return () => {
      cancelled = true;
    };
  }, [orders]);

  const vendorMap = {};
  vendors.forEach((v) => { vendorMap[v.id] = v.businessName || v.ownerName || "Vendor"; });

  const filtered = orders.filter((o) => {
    if (statusFilter !== "All Status" && (o.status || "").toLowerCase() !== statusFilter) return false;
    if (vendorFilter !== "All Vendors" && o.vendorId !== vendorFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const m = orderMetadata(o);
      const cached = o.customerId ? customerById[o.customerId] : null;
      const nameStr = (m.customerName || m.customer_name || cached?.fullName || "").toLowerCase();
      const phoneStr = m.customerPhone || m.customer_phone || cached?.phone || "";
      return (
        (o.orderRef || "").toLowerCase().includes(q) ||
        nameStr.includes(q) ||
        phoneStr.includes(q) ||
        (vendorMap[o.vendorId] || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt)) return "—";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours() % 12 || 12).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");
    const ampm = dt.getHours() >= 12 ? "pm" : "am";
    return `${dd}/${mm}/${yyyy}, ${hh}:${min} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") return { cls: "bg-success-600 text-white", label: "Completed" };
    if (s === "cancelled" || s === "canceled") return { cls: "bg-danger-600 text-white", label: "Cancelled" };
    if (s === "order_await_completion") return { cls: "bg-warning-600 text-white", label: "Order Await Completion" };
    return { cls: "bg-info-600 text-white", label: (status || "Pending").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
  };

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + orders.length;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div>
      {/* ── Filters ── */}
      <div className="d-flex flex-wrap gap-12 mb-20">
        <select className="form-select radius-8 h-40-px" style={{ maxWidth: 180 }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          {DATE_OPTIONS.map((d) => (<option key={d} value={d}>{d}</option>))}
        </select>
        <select className="form-select radius-8 h-40-px" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s === "All Status" ? s : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
        </select>
        <select className="form-select radius-8 h-40-px" style={{ maxWidth: 200 }} value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
          <option value="All Vendors">All Vendors</option>
          {vendors.map((v) => (<option key={v.id} value={v.id}>{v.businessName || v.ownerName}</option>))}
        </select>
      </div>
      <div className="mb-20">
        <div className="input-group radius-8" style={{ maxWidth: 600 }}>
          <span className="input-group-text bg-white border-end-0"><Icon icon="mdi:magnify" /></span>
          <input type="text" className="form-control border-start-0" placeholder="Order ID / Customer mob / Customer name / Vendor name" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card h-100 p-0 radius-12">
        <div className="card-body p-24">
          {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}
          {loading ? (
            <p className="text-secondary-light mb-0">Loading orders...</p>
          ) : (
            <>
              <div className="table-responsive scroll-sm">
                <table className="table bordered-table sm-table mb-0 text-nowrap">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Order ID</th>
                      <th>Date &amp; Time</th>
                      <th>Customer Name</th>
                      <th>Mobile</th>
                      <th>Vendor Name</th>
                      <th>Subtotal</th>
                      <th>Tax</th>
                      <th>Discount</th>
                      <th>P4U Comm.</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((order, index) => {
                        const m = orderMetadata(order);
                        const cached = order.customerId ? customerById[order.customerId] : null;
                        const custName =
                          m.customerName || m.customer_name || cached?.fullName || "—";
                        const custPhone =
                          m.customerPhone || m.customer_phone || cached?.phone || "—";
                        const sb = getStatusBadge(order.status);
                        const isCompleted = (order.status || "").toLowerCase() === "completed";
                        return (
                          <tr key={order.id}>
                            <td>{offset + index + 1}</td>
                            <td className="fw-semibold">{order.orderRef || "—"}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{custName}</td>
                            <td>{custPhone}</td>
                            <td>{vendorMap[order.vendorId] || "—"}</td>
                            <td>₹{order.totalAmount || 0}</td>
                            <td>₹{m.taxAmount || m.tax || 0}</td>
                            <td>₹{m.discount || m.totalDiscount || 0}</td>
                            <td>₹{m.p4uCommission || m.platformFee || 0}</td>
                            <td className="text-center">
                              <span className={`px-16 py-6 radius-4 fw-medium text-sm ${sb.cls}`}>{sb.label}</span>
                            </td>
                            <td className="text-center">
                              <div className="d-flex align-items-center gap-10 justify-content-center">
                                <Link to={`/view-order/${order.id}`} className="text-info-600 fw-medium d-flex flex-column align-items-center" title="View">
                                  <Icon icon="mdi:information-outline" className="text-xl" />
                                  <span className="text-xs">View</span>
                                </Link>
                                {isCompleted && (
                                  <Link to={`/edit-order/${order.id}`} className="text-success-600 fw-medium d-flex flex-column align-items-center" title="Settle">
                                    <Icon icon="lucide:edit" className="text-xl" />
                                    <span className="text-xs">Settle</span>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="12" className="text-center py-4">No orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
                <span>Showing {pageFrom} to {pageTo} of {total} entries</span>
                <div className="d-flex gap-2 align-items-center">
                  <button type="button" className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 h-32-px text-md d-flex align-items-center justify-content-center" disabled={!canPrev} onClick={() => setOffset(Math.max(0, offset - limit))}><Icon icon="ep:d-arrow-left" /></button>
                  <span className="page-link fw-semibold radius-8 border-0 h-32-px w-32-px text-md bg-primary-600 text-white d-flex align-items-center justify-content-center mb-0">{Math.floor(offset / limit) + 1}</span>
                  <button type="button" className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 h-32-px text-md d-flex align-items-center justify-content-center" disabled={!canNext} onClick={() => setOffset(offset + limit)}><Icon icon="ep:d-arrow-right" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderListLayer;
