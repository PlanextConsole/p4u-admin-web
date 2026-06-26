import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { listCashSettlements, listOrders, listVendors } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import SettlementOrderDetailModal from "./SettlementOrderDetailModal";

const STATUS_OPTIONS = [
  { value: "", label: "Status" },
  { value: "pending", label: "Pending" },
  { value: "settled", label: "Settled" },
  { value: "hold", label: "On hold" },
];

const PAGE_SIZE = 20;
const FETCH_LIMIT = 100;
const MAX_ROWS = 4000;

const SETTLED = new Set(["completed", "settled", "paid", "success", "done", "processed"]);
const ON_HOLD = new Set(["on_hold", "hold", "paused", "frozen"]);

function parseMeta(m) {
  if (m == null) return {};
  if (typeof m === "string") {
    try { return JSON.parse(m) || {}; } catch { return {}; }
  }
  return typeof m === "object" && !Array.isArray(m) ? m : {};
}

function settlementBucket(status) {
  const s = String(status || "").toLowerCase().trim();
  if (SETTLED.has(s)) return "settled";
  if (ON_HOLD.has(s)) return "hold";
  return "pending";
}

function formatMoney(n) {
  const x = Number(n) || 0;
  return `₹${x.toLocaleString("en-IN", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function formatCommission(n) {
  const x = Number(n) || 0;
  if (x === 0) return "-₹0";
  const amt = x.toLocaleString("en-IN", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 });
  return `-₹${amt}`;
}

function formatTs(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`;
}

function settlementDisplayId(row) {
  const meta = parseMeta(row.metadata);
  if (meta.settlementRef && String(meta.settlementRef).trim()) return String(meta.settlementRef).trim();
  const raw = String(row.id || "").replace(/-/g, "");
  if (raw.length >= 7) return `STL-${raw.slice(0, 3)}-${raw.slice(3, 7)}`;
  return `STL-${raw.slice(0, 8).toUpperCase()}`;
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

function statusPill(status) {
  const b = settlementBucket(status);
  if (b === "settled") return { cls: "bg-success-100 text-success-700", label: "Settled" };
  if (b === "hold") return { cls: "bg-warning-100 text-warning-700", label: "On hold" };
  return { cls: "bg-info-100 text-info-700", label: String(status || "Pending").replace(/_/g, " ") };
}

function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

async function fetchAllCashSettlements() {
  const all = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && all.length < MAX_ROWS) {
    const res = await listCashSettlements({ limit: FETCH_LIMIT, offset });
    const items = res.items || [];
    all.push(...items);
    total = typeof res.total === "number" ? res.total : all.length;
    offset += items.length;
    if (items.length === 0) break;
  }
  return all;
}

async function fetchOrderRefMap() {
  const map = {};
  let offset = 0;
  let total = Infinity;
  while (offset < total && Object.keys(map).length < MAX_ROWS) {
    const res = await listOrders({ limit: FETCH_LIMIT, offset });
    const items = res.items || [];
    items.forEach((o) => {
      if (o?.id) map[o.id] = o.orderRef || o.id;
    });
    total = typeof res.total === "number" ? res.total : items.length;
    offset += items.length;
    if (items.length === 0) break;
  }
  return map;
}

const SettlementsListLayer = () => {
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orderRefById, setOrderRefById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [settlements, vProd, vSvc, orderMap] = await Promise.all([
        fetchAllCashSettlements(),
        listVendors({ limit: 200, offset: 0, vendorKind: "product" }).then((r) => r.items || []),
        listVendors({ limit: 200, offset: 0, vendorKind: "service" }).then((r) => r.items || []),
        fetchOrderRefMap(),
      ]);
      setRows(settlements);
      setVendors([...vProd, ...vSvc]);
      setOrderRefById(orderMap);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const vendorMap = useMemo(() => {
    const m = {};
    vendors.forEach((v) => { m[v.id] = v.businessName || v.ownerName || "—"; });
    return m;
  }, [vendors]);

  const enriched = useMemo(() => rows.map((row) => {
    const meta = parseMeta(row.metadata);
    const orderAmount = Number(meta.orderAmount ?? meta.orderTotal ?? meta.grandTotal ?? meta.totalOrderValue ?? 0);
    const commission = Number(meta.commission ?? meta.commissionAmount ?? meta.platformCommission ?? meta.platformFee ?? 0);
    const netPayout = Number(meta.netPayout ?? meta.vendorPayout ?? meta.payoutAmount ?? row.amount ?? 0);
    const settledOn = meta.settledAt ?? meta.settledOn ?? meta.paidAt ?? (settlementBucket(row.status) === "settled" ? row.updatedAt : null);
    const txnRef = meta.transactionId ?? meta.txnRef ?? meta.paymentRef ?? meta.paymentRefId ?? "—";
    const bucket = settlementBucket(row.status);
    const orderRef = meta.orderRef ?? meta.orderReference ?? (row.orderId ? orderRefById[row.orderId] : null) ?? row.orderId ?? "—";
    return {
      row,
      settlementId: settlementDisplayId(row),
      createdAt: row.createdAt,
      vendorName: meta.vendorName || vendorMap[row.vendorId] || "—",
      orderRef: orderRef || "—",
      orderId: row.orderId,
      orderAmount,
      commission,
      netPayout,
      txnRef,
      settledOn,
      status: row.status,
      bucket,
    };
  }), [rows, vendorMap, orderRefById]);

  const filtered = useMemo(() => {
    const rangeStart = fromDate ? startOfLocalDay(fromDate) : null;
    const rangeEnd = toDate ? endOfLocalDay(toDate) : null;
    return enriched.filter((r) => {
      const created = new Date(r.createdAt);
      if (!isNaN(created.getTime())) {
        if (rangeStart && created < rangeStart) return false;
        if (rangeEnd && created > rangeEnd) return false;
      }
      if (statusFilter === "pending" && r.bucket !== "pending") return false;
      if (statusFilter === "settled" && r.bucket !== "settled") return false;
      if (statusFilter === "hold" && r.bucket !== "hold") return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          r.settlementId.toLowerCase().includes(q)
          || String(r.row.orderId || "").toLowerCase().includes(q)
          || String(r.orderRef || "").toLowerCase().includes(q)
          || String(r.vendorName || "").toLowerCase().includes(q)
          || String(r.txnRef || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enriched, fromDate, toDate, statusFilter, search]);

  const stats = useMemo(() => {
    let orderAmount = 0;
    let commission = 0;
    let pendingEligible = 0;
    filtered.forEach((r) => {
      orderAmount += r.orderAmount;
      commission += r.commission;
      if (r.bucket === "pending") pendingEligible += 1;
    });
    return {
      total: filtered.length,
      orderAmount,
      commission,
      pendingEligible,
    };
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

  const openOrder = (r) => {
    if (!r.orderId) return;
    setModal({ orderId: r.orderId, vendorName: r.vendorName });
  };

  const exportCsv = () => {
    const header = ["ID", "Vendor", "Order", "Order Amount", "Commission", "Net Payout", "Txn Ref", "Status", "Created", "Settled"];
    const lines = filtered.map((r) => [
      r.settlementId,
      r.vendorName,
      r.orderRef,
      r.orderAmount,
      r.commission,
      r.netPayout,
      r.txnRef,
      r.status,
      formatTs(r.createdAt),
      r.settledOn ? formatTs(r.settledOn) : "",
    ]);
    const csv = toCsv([header, ...lines]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-24">
        <h3 className="fw-bold mb-4">Settlements</h3>
        <span className="text-secondary-light text-sm">
          {stats.total} settlements · Search by ID, vendor, order, or txn ref
        </span>
      </div>

      <div className="row g-16 mb-24">
        <StatCard title="Total Settlements" value={stats.total} icon="mdi:wallet-outline" cardCls="bg-success-50" iconCls="bg-success-100 text-success-600" valueCls="text-success-600" />
        <StatCard title="Order Amount (page)" value={formatMoney(stats.orderAmount)} icon="mdi:currency-inr" cardCls="bg-info-50" iconCls="bg-info-100 text-info-600" valueCls="text-info-600" />
        <StatCard title="Commission (page)" value={formatMoney(stats.commission)} icon="mdi:cash-multiple" cardCls="bg-warning-50" iconCls="bg-warning-100 text-warning-600" valueCls="text-warning-600" />
        <StatCard title="Pending/Eligible" value={stats.pendingEligible} icon="mdi:clock-outline" cardCls="bg-danger-50" iconCls="bg-danger-100 text-danger-600" valueCls="text-danger-600" />
      </div>

      <div className="card radius-12 p-0">
        <div className="card-body p-24">
          <div className="p4u-admin-filter-row gap-12 mb-20">
            <div className="input-group radius-8 p4u-filter-search" style={{ minWidth: 200, maxWidth: 360, flex: "1 1 240px" }}>
              <span className="input-group-text bg-white border-end-0"><Icon icon="mdi:magnify" /></span>
              <input
                type="search"
                className="form-control border-start-0 h-40-px"
                placeholder="Search by ID, vendor, order, txn ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
            <select className="form-select radius-8 h-40-px" style={{ minWidth: 120, maxWidth: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (<option key={s.value || "all"} value={s.value}>{s.label}</option>))}
            </select>
            <input type="date" className="form-control radius-8 h-40-px" style={{ minWidth: 140, maxWidth: 170 }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="From Date" placeholder="From Date" />
            <input type="date" className="form-control radius-8 h-40-px" style={{ minWidth: 140, maxWidth: 170 }} value={toDate} onChange={(e) => setToDate(e.target.value)} title="To Date" placeholder="To Date" />
            <div className="p4u-admin-filter-row__end gap-8">
              <button type="button" className="btn btn-outline-secondary radius-8 d-flex align-items-center gap-8 h-40-px" onClick={exportCsv}>
                <Icon icon="mdi:download-outline" /> Export CSV
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

          {loading ? (
            <p className="text-secondary-light mb-0">Loading settlements…</p>
          ) : (
            <>
              <div className="table-responsive scroll-sm" style={{ overflowX: "auto" }}>
                <table className="table bordered-table sm-table mb-0 text-nowrap align-middle" style={{ minWidth: 1200 }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>VENDOR</th>
                      <th>ORDER</th>
                      <th>ORDER AMOUNT</th>
                      <th>COMMISSION</th>
                      <th>NET PAYOUT</th>
                      <th>TXN REF</th>
                      <th>STATUS</th>
                      <th>CREATED</th>
                      <th>SETTLED</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.length === 0 ? (
                      <tr><td colSpan="11" className="text-center py-40 text-secondary-light">No settlements found.</td></tr>
                    ) : (
                      pageSlice.map((r) => {
                        const pill = statusPill(r.status);
                        const isSettled = r.bucket === "settled";
                        return (
                          <tr key={r.row.id}>
                            <td className="fw-semibold">{r.settlementId}</td>
                            <td>{r.vendorName}</td>
                            <td>
                              {r.orderId ? (
                                <button type="button" className="btn btn-link p-0 text-success-600 fw-medium text-decoration-none" onClick={() => openOrder(r)}>
                                  {r.orderRef}
                                </button>
                              ) : (
                                <span className="text-success-600">{r.orderRef}</span>
                              )}
                            </td>
                            <td>{formatMoney(r.orderAmount)}</td>
                            <td className="text-danger-600">{formatCommission(r.commission)}</td>
                            <td className="text-success-600 fw-semibold">{formatMoney(r.netPayout)}</td>
                            <td>{r.txnRef}</td>
                            <td><span className={`px-12 py-4 radius-pill text-xs fw-medium ${pill.cls}`}>{pill.label}</span></td>
                            <td>{formatTs(r.createdAt)}</td>
                            <td>{r.settledOn ? formatTs(r.settledOn) : "—"}</td>
                            <td>
                              {r.orderId ? (
                                <button
                                  type="button"
                                  className="btn btn-link p-0 d-inline-flex align-items-center gap-6 text-secondary-light text-decoration-none"
                                  onClick={() => openOrder(r)}
                                  title="View order"
                                >
                                  <Icon icon="majesticons:eye-line" className="text-lg" />
                                  <span className="text-sm">{isSettled ? "Settled" : pill.label}</span>
                                </button>
                              ) : (
                                <span className="text-secondary-light text-sm">—</span>
                              )}
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

      {modal?.orderId && (
        <SettlementOrderDetailModal
          orderId={modal.orderId}
          vendorName={modal.vendorName}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

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

export default SettlementsListLayer;
