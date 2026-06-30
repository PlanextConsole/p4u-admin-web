import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  deleteClassifiedProduct,
  listClassifiedCategories,
  listClassifiedProducts,
  listClassifiedServices,
  listClassifiedVendors,
  updateClassifiedProduct,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";

const FETCH_LIMIT = 100;
const MAX_ROWS = 4000;

function parseMeta(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try { return JSON.parse(value) || {}; } catch { return {}; }
  }
  return typeof value === "object" && !Array.isArray(value) ? value : {};
}

function statusOf(row) {
  const meta = parseMeta(row.metadata);
  const raw = String(meta.approvalStatus || meta.status || "").toLowerCase();
  if (["pending", "approved", "rejected"].includes(raw)) return raw;
  return row.isActive === false ? "rejected" : "approved";
}

function adId(row) {
  const meta = parseMeta(row.metadata);
  if (meta.adId) return String(meta.adId);
  const compact = String(row.id || "").replace(/-/g, "");
  return `CLA${compact.slice(0, 7).toUpperCase()}`;
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatInr(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: n % 1 ? 2 : 0 })}`;
}

async function fetchAllProducts() {
  const all = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && all.length < MAX_ROWS) {
    const res = await listClassifiedProducts({ purpose: "all", limit: FETCH_LIMIT, offset });
    const items = res.items || [];
    all.push(...items);
    total = typeof res.total === "number" ? res.total : all.length;
    offset += items.length;
    if (items.length === 0) break;
  }
  return all;
}

async function fetchMaps() {
  const [vRes, cRes, sRes] = await Promise.all([
    listClassifiedVendors({ purpose: "all", limit: 200, offset: 0 }),
    listClassifiedCategories({ purpose: "all", limit: 200, offset: 0 }),
    listClassifiedServices({ purpose: "all", limit: 200, offset: 0 }),
  ]);
  return {
    vendors: Object.fromEntries((vRes.items || []).map((x) => [x.id, x])),
    categories: Object.fromEntries((cRes.items || []).map((x) => [x.id, x])),
    services: Object.fromEntries((sRes.items || []).map((x) => [x.id, x])),
  };
}

const ClassifiedModal = ({ mode, row, categoryName, vendorName, onClose, onSaved, onDeleted }) => {
  const meta = parseMeta(row.metadata);
  const [form, setForm] = useState({
    name: row.name || "",
    description: row.description || "",
    price: String(row.price ?? "0"),
    category: categoryName || "",
    city: meta.city || meta.cityName || "",
    area: meta.area || meta.areaName || "",
    status: statusOf(row),
    imageUrls: Array.isArray(row.imageUrls) ? row.imageUrls : [],
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const isView = mode === "view";

  const save = async (event) => {
    event.preventDefault();
    if (isView) return;
    setSaving(true);
    try {
      let imageUrls = form.imageUrls;
      if (fileRef.current || file) {
        const uploaded = await uploadFile(fileRef.current || file);
        imageUrls = [...imageUrls, uploaded.url];
      }
      const nextMeta = { ...meta, city: form.city, area: form.area, approvalStatus: form.status, status: form.status };
      await updateClassifiedProduct(row.id, {
        name: form.name,
        description: form.description,
        price: form.price || "0",
        imageUrls,
        isActive: form.status === "approved",
        metadata: nextMeta,
      });
      toast.success("Classified ad updated.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this classified ad?")) return;
    setSaving(true);
    try {
      await deleteClassifiedProduct(row.id);
      toast.success("Classified ad deleted.");
      onDeleted();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const primaryImage = form.imageUrls[0];

  return (
    <form className='p4u-classified-modal' onSubmit={save}>
      <h2>{isView ? "View Classified Ad" : "Edit Classified Ad"}</h2>
      <label>Images</label>
      <div className='p4u-classified-images'>
        {primaryImage ? <img src={resolveMediaUrl(primaryImage)} alt={form.name} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
        {!isView ? (
          <label className='p4u-classified-upload'>
            <input type='file' accept={IMAGE_ACCEPT} onChange={(event) => { const next = event.target.files?.[0]; if (next) { fileRef.current = next; setFile(next); } }} />
            <Icon icon='lucide:image' />
            <span>{file ? file.name : "Add Image from Media Library"}</span>
            <small>Click to open Media Library</small>
          </label>
        ) : null}
      </div>
      <label className='p4u-classified-field is-full'><span>Title</span><input value={form.name} disabled={isView || saving} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
      <div className='p4u-classified-field is-full'><span>Description</span>{isView ? <p>{form.description || "--"}</p> : <div className='p4u-classified-editor'><div><Icon icon='mdi:format-bold' /><Icon icon='mdi:format-italic' /><Icon icon='mdi:format-underline' /><Icon icon='mdi:format-list-bulleted' /><Icon icon='mdi:format-list-numbered' /><span /><Icon icon='lucide:pencil' className='is-teal' /><Icon icon='lucide:eye' /></div><textarea value={form.description} disabled={saving} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>}</div>
      <div className='p4u-classified-grid'>
        <label className='p4u-classified-field'><span>Price (₹)</span><input value={form.price} disabled={isView || saving} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} /></label>
        <label className='p4u-classified-field'><span>Category</span><input value={form.category} disabled /></label>
        <label className='p4u-classified-field'><span>City</span><input value={form.city} disabled={isView || saving} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></label>
        <label className='p4u-classified-field'><span>Area</span><input value={form.area} disabled={isView || saving} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} /></label>
      </div>
      {!isView ? <label className='p4u-classified-field is-full'><span>Status</span><select value={form.status} disabled={saving} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value='pending'>Pending</option><option value='approved'>Approved</option><option value='rejected'>Rejected</option></select></label> : null}
      <div className='p4u-classified-footer'>
        {!isView ? <button type='button' className='p4u-classified-delete' onClick={remove} disabled={saving}><Icon icon='lucide:trash-2' /> Delete</button> : <span />}
        <div><button type='button' className='p4u-classified-cancel' onClick={onClose}>{isView ? "Close" : "Cancel"}</button>{isView ? <button type='button' className='p4u-classified-submit' onClick={() => onSaved("edit")}>Edit</button> : <button type='submit' className='p4u-classified-submit' disabled={saving}>{saving ? "Saving..." : "Save"}</button>}</div>
      </div>
    </form>
  );
};

const ClassifiedAdsReportLayer = () => {
  const [products, setProducts] = useState([]);
  const [maps, setMaps] = useState({ vendors: {}, categories: {}, services: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [items, nextMaps] = await Promise.all([fetchAllProducts(), fetchMaps()]);
      setProducts(items);
      setMaps(nextMaps);
    } catch (e) {
      setProducts([]);
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const enriched = useMemo(() => products.map((row) => {
    const meta = parseMeta(row.metadata);
    const category = maps.categories[row.categoryId]?.name || meta.category || "--";
    const vendor = maps.vendors[row.vendorId]?.displayName || meta.postedBy || "Vendor";
    const image = Array.isArray(row.imageUrls) ? row.imageUrls[0] : null;
    return { row, id: adId(row), title: row.name || "--", category, vendor, image, status: statusOf(row), price: Number(row.price || 0), city: meta.city || meta.cityName || "", area: meta.area || meta.areaName || "", createdAt: row.createdAt, updatedAt: row.updatedAt };
  }), [maps, products]);

  const filtered = useMemo(() => enriched.filter((item) => {
    const created = item.createdAt ? String(item.createdAt).slice(0, 10) : "";
    const q = search.trim().toLowerCase();
    return (status === "all" || item.status === status)
      && (!fromDate || !created || created >= fromDate)
      && (!toDate || !created || created <= toDate)
      && (!q || [item.id, item.title, item.category, item.vendor, item.city, item.area].join(" ").toLowerCase().includes(q));
  }), [enriched, fromDate, search, status, toDate]);

  const stats = useMemo(() => ({
    total: filtered.length,
    pending: filtered.filter((x) => x.status === "pending").length,
    approved: filtered.filter((x) => x.status === "approved").length,
    value: filtered.reduce((sum, x) => sum + x.price, 0),
  }), [filtered]);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [["ID", "Title", "Price", "Location", "Posted By", "Status", "Created", "Updated"], ...filtered.map((x) => [x.id, x.title, x.price, `${x.area}, ${x.city}`, x.vendor, x.status, x.createdAt, x.updatedAt])].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "classified-ads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const selected = modal ? enriched.find((x) => x.row.id === modal.id) : null;

  return (
    <div className='p4u-classified-page'>
      <section className='p4u-classified-hero'><h1>Classified Ads</h1><p>{filtered.length} ads · Admin approval required</p></section>
      {error ? <div className='p4u-classified-error'>{error}</div> : null}
      <section className='p4u-classified-stats'>
        <article className='is-total'><Icon icon='lucide:megaphone' /><div><span>Total Ads</span><strong>{stats.total}</strong></div></article>
        <article className='is-pending'><Icon icon='lucide:clock' /><div><span>Pending Review</span><strong>{stats.pending}</strong></div></article>
        <article className='is-approved'><Icon icon='lucide:shield-check' /><div><span>Approved</span><strong>{stats.approved}</strong></div></article>
        <article className='is-value'><Icon icon='mdi:currency-inr' /><div><span>Total Value</span><strong>{formatInr(stats.value)}</strong></div></article>
      </section>
      <section className='p4u-classified-card'>
        <div className='p4u-classified-toolbar'>
          <div><label className='p4u-classified-search'><Icon icon='ion:search-outline' /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search ads...' /></label><label className='p4u-classified-select'><select value={status} onChange={(e) => setStatus(e.target.value)}><option value='all'>Status</option><option value='pending'>Pending</option><option value='approved'>Approved</option><option value='rejected'>Rejected</option></select><Icon icon='lucide:chevron-down' /></label></div>
          <div><label className='p4u-classified-date'><Icon icon='lucide:calendar-days' /><span>From Date</span><input type='date' value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label><label className='p4u-classified-date'><Icon icon='lucide:calendar-days' /><span>To Date</span><input type='date' value={toDate} onChange={(e) => setToDate(e.target.value)} /></label><button type='button' onClick={exportCsv}><Icon icon='lucide:download' />Export CSV</button></div>
        </div>
        <div className='p4u-classified-table-wrap'><table className='p4u-classified-table'><thead><tr><th><i /></th><th>ID</th><th>Image</th><th>Title</th><th>Price</th><th>Location</th><th>Posted By</th><th>Status</th><th>Created</th><th>Updated</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan='11' className='p4u-classified-empty'>Loading...</td></tr> : filtered.length === 0 ? <tr><td colSpan='11' className='p4u-classified-empty'>No classified ads found.</td></tr> : filtered.map((item) => <tr key={item.row.id}><td><i /></td><td>{item.id}</td><td>{item.image ? <img src={resolveMediaUrl(item.image)} alt={item.title} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span className='p4u-classified-placeholder'><Icon icon='mdi:cube-outline' /></span>}</td><td><strong>{item.title}</strong><small>{item.category}</small></td><td>{formatInr(item.price)}</td><td>{[item.area, item.city].filter(Boolean).join(", ") || "--"}</td><td>{item.vendor}</td><td><span className={`p4u-classified-pill is-${item.status}`}>{item.status}</span></td><td>{formatDateTime(item.createdAt)}</td><td>{formatDateTime(item.updatedAt)}</td><td><div className='p4u-classified-actions'><button type='button' onClick={() => setModal({ mode: "view", id: item.row.id })}><Icon icon='lucide:eye' /></button><button type='button' onClick={() => setModal({ mode: "edit", id: item.row.id })}><Icon icon='lucide:pencil' /></button><button type='button' className='is-danger' onClick={() => setModal({ mode: "edit", id: item.row.id })}><Icon icon='lucide:x-circle' /></button></div></td></tr>)}</tbody></table></div>
      </section>
      {modal && selected ? <FormModal onClose={() => setModal(null)} size='md'><ClassifiedModal mode={modal.mode} row={selected.row} categoryName={selected.category} vendorName={selected.vendor} onClose={() => setModal(null)} onSaved={(nextMode) => { if (nextMode === "edit") setModal({ mode: "edit", id: selected.row.id }); else { setModal(null); load(); } }} onDeleted={() => { setModal(null); load(); }} /></FormModal> : null}
    </div>
  );
};

export default ClassifiedAdsReportLayer;
