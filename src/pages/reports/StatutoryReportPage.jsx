import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import MasterLayout from "../../masterLayout/MasterLayout";
import { listOrders } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const definitions = {
  "gstr-1": { title: "GSTR-1 - Outward Supplies", note: "Invoice-wise outward supplies for the selected filing period." },
  "gstr-3b": { title: "GSTR-3B - Monthly Summary", note: "Summary of taxable outward supplies and GST liability." },
  "credit-notes": { title: "Credit Notes - GSTR-1 Table 9B", note: "Cancelled and refunded orders requiring tax reversal." },
  "hsn-summary": { title: "HSN-wise Summary", note: "Taxable value and GST grouped by HSN/SAC code." },
  "tcs": { title: "TCS u/s 52 - GSTR-8", note: "Marketplace TCS computation grouped by vendor." },
  "tds-194o": { title: "TDS u/s 194-O", note: "Marketplace payout withholding computation grouped by vendor." },
  "gstr-9": { title: "GSTR-9 - Annual Return", note: "Annual consolidated outward-supply and tax summary." },
  "day-book": { title: "Day Book", note: "Voucher-level accounting register for period close and export." },
};

const number = (value) => { const parsed = Number(String(value ?? 0).replace(/[^0-9.-]/g, "")); return Number.isFinite(parsed) ? parsed : 0; };
const money = (value) => `INR ${number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateValue = (row) => row.createdAt || row.created_at || row.orderDate || row.placedAt || row.updatedAt;
const dateLabel = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN"); };
const metadata = (row) => { const raw = row.metadata; if (!raw) return {}; if (typeof raw === "object") return raw; try { return JSON.parse(raw); } catch { return {}; } };
const orderTotal = (row) => number(row.totalAmount ?? row.total_amount ?? row.total);
const taxTotal = (row) => { const meta = metadata(row); return number(row.taxAmount ?? row.tax_amount ?? row.tax ?? meta.taxAmount ?? meta.tax ?? meta.gst); };
const taxable = (row) => Math.max(0, orderTotal(row) - taxTotal(row));
const vendor = (row) => String(row.vendorName || row.vendor_name || row.vendorId || row.vendor_id || "Platform");
const hsn = (row) => String(row.hsnCode || row.hsn_code || metadata(row).hsnCode || "UNSPECIFIED");
const status = (row) => String(row.status || "unknown").toLowerCase();
const id = (row) => String(row.orderNumber || row.orderRef || row.order_ref || row.id || "-");
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function loadRows(result) { return Array.isArray(result) ? result : result?.items || result?.data || result?.rows || []; }

export default function StatutoryReportPage({ kind }) {
  const definition = definitions[kind] || definitions["day-book"];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(loadRows(await listOrders({ limit: 5000, offset: 0, includeDeleted: true }))); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : String(requestError?.message || requestError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => rows.filter((row) => {
    const timestamp = new Date(dateValue(row)).getTime();
    if (from && timestamp < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && timestamp > new Date(`${to}T23:59:59`).getTime()) return false;
    if (kind === "credit-notes" && !["cancelled", "refunded", "returned"].includes(status(row))) return false;
    return true;
  }), [rows, from, to, kind]);

  const reportRows = useMemo(() => {
    if (kind === "hsn-summary") return Object.values(filtered.reduce((groups, row) => { const key = hsn(row); const current = groups[key] || { key, label: key, count: 0, taxable: 0, tax: 0, total: 0 }; current.count += 1; current.taxable += taxable(row); current.tax += taxTotal(row); current.total += orderTotal(row); groups[key] = current; return groups; }, {}));
    if (["tcs", "tds-194o"].includes(kind)) return Object.values(filtered.reduce((groups, row) => { const key = vendor(row); const current = groups[key] || { key, label: key, count: 0, taxable: 0, tax: 0, total: 0 }; current.count += 1; current.taxable += taxable(row); current.total += orderTotal(row); current.tax = current.taxable * 0.01; groups[key] = current; return groups; }, {}));
    return filtered.map((row) => ({ key: id(row), label: id(row), date: dateLabel(dateValue(row)), vendor: vendor(row), state: status(row), count: 1, taxable: taxable(row), tax: taxTotal(row), total: orderTotal(row) }));
  }, [filtered, kind]);

  const totals = reportRows.reduce((sum, row) => ({ count: sum.count + number(row.count), taxable: sum.taxable + number(row.taxable), tax: sum.tax + number(row.tax), total: sum.total + number(row.total) }), { count: 0, taxable: 0, tax: 0, total: 0 });
  function exportCsv() { const header = ["Reference", "Date", "Vendor/HSN", "Status", "Transactions", "Taxable value", "Tax/TCS/TDS", "Gross value"]; const body = reportRows.map((row) => [row.label, row.date || "", row.vendor || (row.label !== row.key ? row.label : ""), row.state || "", row.count, number(row.taxable).toFixed(2), number(row.tax).toFixed(2), number(row.total).toFixed(2)]); const blob = new Blob([[header, ...body].map((line) => line.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${kind}-${from || "all"}-${to || "all"}.csv`; link.click(); URL.revokeObjectURL(url); }

  return <MasterLayout><div className="card border-0"><div className="card-body p-24">
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3"><div><h4 className="mb-6">{definition.title}</h4><p className="text-secondary-light mb-0">{definition.note}</p></div><div className="d-flex flex-wrap gap-2"><input type="date" className="form-control" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date"/><input type="date" className="form-control" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date"/><button className="btn btn-outline-primary" onClick={() => void load()}><Icon icon="mdi:refresh"/> Refresh</button><button className="btn btn-primary" disabled={!reportRows.length} onClick={exportCsv}><Icon icon="mdi:download"/> CSV</button></div></div>
    {error && <div className="alert alert-danger mt-20">{error}</div>}
    <div className="row g-3 mt-8"><Metric label="Transactions" value={totals.count}/><Metric label="Taxable value" value={money(totals.taxable)}/><Metric label="Tax / withholding" value={money(totals.tax)}/><Metric label="Gross value" value={money(totals.total)}/></div>
    <div className="table-responsive mt-24"><table className="table bordered-table mb-0"><thead><tr><th>Reference</th><th>Date</th><th>Vendor / HSN</th><th>Status</th><th className="text-end">Transactions</th><th className="text-end">Taxable</th><th className="text-end">Tax/TCS/TDS</th><th className="text-end">Gross</th></tr></thead><tbody>{loading?<tr><td colSpan={8} className="text-center py-40">Loading report...</td></tr>:reportRows.map((row)=><tr key={row.key}><td className="fw-semibold">{row.label}</td><td>{row.date || "-"}</td><td>{row.vendor || (["hsn-summary","tcs","tds-194o"].includes(kind) ? row.label : "-")}</td><td className="text-capitalize">{row.state || "-"}</td><td className="text-end">{row.count}</td><td className="text-end">{money(row.taxable)}</td><td className="text-end">{money(row.tax)}</td><td className="text-end fw-semibold">{money(row.total)}</td></tr>)}{!loading&&!reportRows.length?<tr><td colSpan={8} className="text-center py-40 text-secondary-light">No transactions for this filing period.</td></tr>:null}</tbody></table></div>
    <p className="mt-16 mb-0 text-xs text-secondary-light">Generated from recorded platform orders. Review filing classifications and tax rates with the authorised finance team before submission.</p>
  </div></div></MasterLayout>;
}

function Metric({ label, value }) { return <div className="col-12 col-sm-6 col-xl-3"><div className="bg-neutral-50 radius-12 p-16"><span className="text-sm text-secondary-light">{label}</span><strong className="d-block mt-6 text-xl">{value}</strong></div></div>; }
