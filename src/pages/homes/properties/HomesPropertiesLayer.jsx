import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { listHomesProperties, moderateHomesProperty } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

const statusOptions = ["all", "pending", "approved", "verified", "rejected"];
const errorMessage = (error) => error instanceof ApiError ? error.message : String(error?.message || error || "Request failed");
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function HomesPropertiesLayer() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { const result = await listHomesProperties({ includeInactive: true, limit: 1000, offset: 0 }); setRows(result.items || []); }
    catch (error) { toast.error(errorMessage(error)); setRows([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return rows.filter((row) => {
    const rowStatus = String(row.moderationStatus || row.status || "pending").toLowerCase();
    if (status !== "all" && rowStatus !== status) return false;
    return !query || [row.title, row.locality, row.city, row.propertyType, row.listingType, row.postedBy, row.customerId].some((value) => String(value || "").toLowerCase().includes(query));
  }); }, [rows, search, status]);
  const totals = useMemo(() => rows.reduce((summary, row) => { const key = String(row.moderationStatus || row.status || "pending").toLowerCase(); summary[key] = (summary[key] || 0) + 1; return summary; }, {}), [rows]);
  async function moderate(id, nextStatus) { setBusyId(id); try { await moderateHomesProperty(id, nextStatus); toast.success(`Property marked ${nextStatus}.`); await load(); } catch (error) { toast.error(errorMessage(error)); } finally { setBusyId(""); } }
  return <div className="p4u-homes-moderation-page">
    <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4"><div><h1 className="mb-1">All Properties</h1><p className="text-secondary mb-0">Search, review and moderate every submitted property.</p></div><button type="button" className="btn btn-outline-primary" onClick={() => void load()} disabled={loading}><Icon icon="mdi:refresh" /> Refresh</button></div>
    <div className="p4u-homes-stat-grid"><article className="p4u-homes-stat"><Icon icon="mdi:home-city-outline" /><div><strong>{rows.length}</strong><span>Total properties</span></div></article><article className="p4u-homes-stat is-warm"><Icon icon="mdi:clock-outline" /><div><strong>{totals.pending || 0}</strong><span>Pending review</span></div></article><article className="p4u-homes-stat"><Icon icon="mdi:shield-check-outline" /><div><strong>{(totals.approved || 0) + (totals.verified || 0)}</strong><span>Live properties</span></div></article></div>
    <section className="p4u-homes-table-card"><div className="p4u-homes-toolbar"><label className="p4u-homes-search"><Icon icon="mdi:magnify" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, owner or location" /></label><select className="form-select" style={{ maxWidth: 190 }} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Property status">{statusOptions.map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : value[0].toUpperCase() + value.slice(1)}</option>)}</select></div>
      <div className="p4u-homes-table-wrap"><table className="p4u-homes-table"><thead><tr><th>Property</th><th>Type</th><th>Price</th><th>Owner</th><th>Photos</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {loading && <tr><td colSpan={7} className="p4u-homes-empty">Loading properties...</td></tr>}
        {!loading && filtered.map((row) => { const rowStatus = String(row.moderationStatus || row.status || "pending").toLowerCase(); return <tr key={row.id}><td><strong>{row.title || "Untitled property"}</strong><small>{[row.locality, row.city].filter(Boolean).join(", ") || "Location not supplied"}</small></td><td><span className="p4u-homes-type-pill">{row.listingType || "-"}</span><small>{row.propertyType || "-"}</small></td><td className="p4u-homes-price">{money(row.price)}</td><td>{row.postedBy || row.customerId || "-"}</td><td><span className="p4u-homes-photo-pill">{Number(row.photoCount || 0)}</span></td><td><span className={`badge ${rowStatus === "rejected" ? "bg-danger-focus text-danger-main" : rowStatus === "pending" ? "bg-warning-focus text-warning-main" : "bg-success-focus text-success-main"}`}>{rowStatus}</span></td><td><div className="p4u-homes-row-actions"><button type="button" className="is-approve" disabled={busyId === row.id || rowStatus === "approved"} onClick={() => void moderate(row.id, "approved")}><Icon icon="mdi:check-circle-outline" /><span>Approve</span></button><button type="button" className="is-reject" disabled={busyId === row.id || rowStatus === "rejected"} onClick={() => void moderate(row.id, "rejected")}><Icon icon="mdi:close-circle-outline" /><span>Reject</span></button></div></td></tr>; })}
        {!loading && filtered.length === 0 && <tr><td colSpan={7} className="p4u-homes-empty">No properties match the selected filters.</td></tr>}
      </tbody></table></div><div className="p4u-homes-pagination"><span>Showing {filtered.length} of {rows.length} properties</span></div></section>
  </div>;
}
