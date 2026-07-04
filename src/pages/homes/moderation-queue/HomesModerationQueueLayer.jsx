import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { listHomesProperties, moderateHomesProperty } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "reported", label: "Reported" },
  { key: "autoFlagged", label: "Auto-Flagged" },
];

function errorMessage(e) { return e instanceof ApiError ? e.message : String(e?.message || e || "Something went wrong"); }
function money(value) { return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`; }
function dateLabel(value) { if (!value) return "-"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }
function compactTitle(title) { return title && title.length > 24 ? `${title.slice(0, 22)}...` : title || "Untitled property"; }
function countForTab(items, key) { if (key === "pending") return items.filter((item) => item.status === "pending").length; if (key === "reported") return items.filter((item) => item.reported).length; if (key === "autoFlagged") return items.filter((item) => item.autoFlagged).length; return 0; }
function toUiProperty(row) {
  const details = row.details || {};
  return {
    id: row.id,
    title: row.title || "Untitled property",
    shortTitle: compactTitle(row.title),
    address: [row.locality, row.city].filter(Boolean).join(", ") || "-",
    type: row.listingType || "-",
    property: row.propertyType || "-",
    price: money(row.price),
    bhk: details.bhk ?? "-",
    area: details.area || "-",
    floor: details.floor || "-",
    furnishing: details.furnishing || "-",
    parking: details.parking || "-",
    facing: details.facing || "-",
    location: [row.locality, row.city].filter(Boolean).join(", ") || "-",
    postedBy: row.postedBy || "-",
    role: row.postedBy ? String(row.postedBy).replace(/.*\((.*?)\).*/i, "$1") : "-",
    views: Number(details.views || 0),
    enquiries: Number(details.enquiries || 0),
    deposit: details.deposit ? money(details.deposit) : "-",
    description: details.description || "-",
    amenities: Array.isArray(details.amenities) ? details.amenities : [],
    photos: Number(row.photoCount || 0),
    submitted: dateLabel(row.submittedAt || row.createdAt),
    status: row.moderationStatus || "pending",
    reported: Boolean(row.isReported),
    autoFlagged: Boolean(row.isAutoFlagged),
  };
}

function DetailLine({ label, value }) { return <div className='p4u-homes-detail-line'><span>{label}:</span> <strong>{value}</strong></div>; }

function ModerationModal({ property, onClose, onAction }) {
  if (!property) return null;
  return (
    <div className='p4u-homes-modal-backdrop' role='presentation' onClick={onClose}>
      <section className='p4u-homes-modal' role='dialog' aria-modal='true' aria-label='Property details' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='p4u-homes-modal-close' onClick={onClose} aria-label='Close'><Icon icon='mdi:close' /></button>
        <h2>{property.title}</h2>
        <div className='p4u-homes-detail-grid'><DetailLine label='Type' value={property.type} /><DetailLine label='Property' value={property.property} /><DetailLine label='Price' value={property.price} /><DetailLine label='BHK' value={property.bhk} /><DetailLine label='Area' value={property.area} /><DetailLine label='Floor' value={property.floor} /><DetailLine label='Furnishing' value={property.furnishing} /><DetailLine label='Parking' value={property.parking} /><DetailLine label='Facing' value={property.facing} /><DetailLine label='Location' value={property.location} /><DetailLine label='Posted by' value={property.postedBy} /><DetailLine label='Views' value={property.views} /><DetailLine label='Enquiries' value={property.enquiries} /><DetailLine label='Deposit' value={property.deposit} /></div>
        <p className='p4u-homes-description'>{property.description}</p>
        <div className='p4u-homes-amenities'><span>Amenities</span><div>{property.amenities.length ? property.amenities.map((item) => <em key={item}>{item}</em>) : <em>None</em>}</div></div>
        <div className='p4u-homes-modal-actions'><button type='button' className='is-approve' onClick={() => onAction(property.id, "approved")}><Icon icon='mdi:check-circle-outline' /> Approve</button><button type='button' className='is-reject' onClick={() => onAction(property.id, "rejected")}><Icon icon='mdi:close-circle-outline' /> Reject</button><button type='button' className='is-verify' onClick={() => onAction(property.id, "verified")}><Icon icon='mdi:shield-outline' /> Verify</button></div>
      </section>
    </div>
  );
}

export default function HomesModerationQueueLayer() {
  const [properties, setProperties] = useState([]);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await listHomesProperties({ includeInactive: true, limit: 500, offset: 0 }); setProperties((res.items || []).map(toUiProperty)); }
    catch (e) { toast.error(errorMessage(e)); setProperties([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({ pending: countForTab(properties, "pending"), reported: countForTab(properties, "reported"), autoFlagged: countForTab(properties, "autoFlagged"), noPhotos: properties.filter((item) => Number(item.photos || 0) === 0).length }), [properties]);
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return properties.filter((item) => { if (tab === "pending" && item.status !== "pending") return false; if (tab === "reported" && !item.reported) return false; if (tab === "autoFlagged" && !item.autoFlagged) return false; if (!q) return true; return [item.title, item.address, item.type, item.role].some((value) => String(value).toLowerCase().includes(q)); }); }, [properties, search, tab]);

  const handleAction = async (id, status) => { try { await moderateHomesProperty(id, status); toast.success("Property updated."); setSelected(null); await load(); } catch (e) { toast.error(errorMessage(e)); } };

  return (
    <div className='p4u-homes-moderation-page'>
      <h1>Moderation Queue</h1>
      <div className='p4u-homes-stat-grid'><article className='p4u-homes-stat is-warm'><Icon icon='mdi:clock-outline' /><div><strong>{counts.pending}</strong><span>Pending Review</span></div></article><article className='p4u-homes-stat is-pink'><Icon icon='mdi:flag-outline' /><div><strong>{counts.reported}</strong><span>Reports</span></div></article><article className='p4u-homes-stat is-warm'><Icon icon='mdi:alert-outline' /><div><strong>{counts.noPhotos}</strong><span>No Photos</span></div></article></div>
      <div className='p4u-homes-tabs' role='tablist' aria-label='Moderation filters'>{TABS.map((item) => <button key={item.key} type='button' className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>{item.label} ({countForTab(properties, item.key)})</button>)}</div>
      <section className='p4u-homes-table-card'><div className='p4u-homes-toolbar'><label className='p4u-homes-search'><Icon icon='mdi:magnify' /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search...' /></label></div><div className='p4u-homes-table-wrap'><table className='p4u-homes-table'><thead><tr><th aria-label='Select'></th><th>Property</th><th>Type</th><th>Price</th><th>By</th><th>Photos</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={8} className='p4u-homes-empty'>Loading...</td></tr> : null}
        {!loading && filtered.map((item) => <tr key={item.id}><td><input type='checkbox' aria-label={`Select ${item.title}`} /></td><td><button type='button' className='p4u-homes-property-link' onClick={() => setSelected(item)}><strong>{item.shortTitle}</strong><span>{item.address}</span></button></td><td><span className='p4u-homes-type-pill'>{item.type}</span></td><td className='p4u-homes-price'>{item.price}</td><td>{item.role}</td><td><span className='p4u-homes-photo-pill'>{item.photos}</span></td><td>{item.submitted}</td><td><div className='p4u-homes-row-actions'><button type='button' className='is-approve' onClick={() => handleAction(item.id, "approved")}><Icon icon='mdi:check-circle-outline' /> <span>Approve</span></button><button type='button' className='is-reject' onClick={() => handleAction(item.id, "rejected")}><Icon icon='mdi:close-circle-outline' /> <span>Reject</span></button><button type='button' className='is-view' onClick={() => setSelected(item)} aria-label='View property'><Icon icon='mdi:eye-outline' /></button></div></td></tr>)}
        {!loading && filtered.length === 0 ? <tr><td colSpan={8} className='p4u-homes-empty'>No properties found.</td></tr> : null}
      </tbody></table></div><div className='p4u-homes-pagination'><span>Showing {filtered.length ? '1' : '0'}-{filtered.length} of {filtered.length}</span><div><button type='button' aria-label='Previous page'><Icon icon='mdi:chevron-left' /></button><strong>1</strong><button type='button' aria-label='Next page'><Icon icon='mdi:chevron-right' /></button></div></div></section>
      <ModerationModal property={selected} onClose={() => setSelected(null)} onAction={handleAction} />
    </div>
  );
}