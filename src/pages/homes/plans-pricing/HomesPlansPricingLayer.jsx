import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { createHomesPlan, deleteHomesPlan, listHomesPlans, updateHomesPlan } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

const PLAN_TYPES = [
  { key: "owner", label: "Owner Plans" },
  { key: "seeker", label: "Seeker Plans" },
  { key: "assisted", label: "Assisted Plans" },
];

const emptyPlan = {
  id: "",
  type: "owner",
  name: "",
  description: "",
  price: "0",
  duration: "30",
  listings: "0",
  contacts: "0",
  boost: false,
  active: true,
  features: [],
};

function errorMessage(e) {
  return e instanceof ApiError ? e.message : String(e?.message || e || "Something went wrong");
}

function planTypeLabel(type) {
  if (type === "seeker") return "Seeker";
  if (type === "assisted") return "Assisted";
  return "Owner";
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function toUiPlan(row) {
  return {
    id: row.id,
    type: row.planType || row.type || "owner",
    name: row.name || "",
    description: row.description || "",
    price: String(row.price ?? "0"),
    duration: row.durationDays ?? row.duration ?? 0,
    listings: row.listingLimit ?? row.listings ?? 0,
    contacts: row.contactReveals ?? row.contacts ?? 0,
    boost: Boolean(row.visibilityBoost ?? row.boost),
    active: row.isActive !== false,
    features: Array.isArray(row.features) ? row.features : [],
  };
}

function Toggle({ checked, onChange, label }) {
  return <label className='p4u-plans-switch'><input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} /><span />{label}</label>;
}

function PlanModal({ initial, defaultType, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyPlan, type: defaultType, ...(initial || {}) });
  const [featureDraft, setFeatureDraft] = useState("");
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const addFeature = () => {
    const value = featureDraft.trim();
    if (!value) return;
    setForm((prev) => ({ ...prev, features: [...(prev.features || []), value] }));
    setFeatureDraft("");
  };

  const removeFeature = (feature) => setForm((prev) => ({ ...prev, features: (prev.features || []).filter((item) => item !== feature) }));

  const save = () => onSave({
    ...form,
    price: String(form.price || 0).replace(/[^0-9.]/g, "") || "0",
    duration: Number(form.duration || 0),
    listings: Number(form.listings || 0),
    contacts: Number(form.contacts || 0),
  });

  return (
    <div className='p4u-plans-modal-backdrop' role='presentation' onClick={onClose}>
      <section className='p4u-plans-modal' role='dialog' aria-modal='true' aria-label='Plan form' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='p4u-plans-modal-close' onClick={onClose} aria-label='Close'><Icon icon='mdi:close' /></button>
        <h2>{form.id ? "Edit Plan" : "Add Plan"}</h2>
        <div className='p4u-plans-form'>
          <label className='is-full'><span>Name *</span><input value={form.name} onChange={(e) => setField("name", e.target.value)} autoFocus /></label>
          <label className='is-full'><span>Description</span><div className='p4u-plans-editor'><div><Icon icon='mdi:format-bold' /><Icon icon='mdi:format-italic' /><Icon icon='mdi:format-underline' /><Icon icon='mdi:format-list-bulleted' /><Icon icon='mdi:format-list-numbered' /><i /><button type='button' aria-label='Edit'><Icon icon='mdi:pencil-outline' /></button><Icon icon='mdi:eye-outline' /></div><textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder='Plan description...' /></div></label>
          <label className='is-full'><span>Plan Type</span><select value={form.type} onChange={(e) => setField("type", e.target.value)}><option value='owner'>Owner</option><option value='seeker'>Seeker</option><option value='assisted'>Assisted</option></select></label>
          <div className='p4u-plans-form-grid'>
            <label><span>Price (₹)</span><input value={String(form.price).replace(/^₹/, "")} onChange={(e) => setField("price", e.target.value)} /></label>
            <label><span>Duration (days)</span><input value={form.duration} onChange={(e) => setField("duration", e.target.value)} /></label>
            <label><span>Listing Limit</span><input value={form.listings} onChange={(e) => setField("listings", e.target.value)} /></label>
            <label><span>Contact Reveals</span><input value={form.contacts} onChange={(e) => setField("contacts", e.target.value)} /></label>
          </div>
          <Toggle checked={form.boost} onChange={(value) => setField("boost", value)} label='Visibility Boost' />
          <Toggle checked={form.active} onChange={(value) => setField("active", value)} label='Active' />
          <div className='p4u-plans-feature-block'><span>Plan Features</span><div className='p4u-plans-feature-input'><input value={featureDraft} onChange={(e) => setFeatureDraft(e.target.value)} placeholder='e.g., Priority listing' /><button type='button' onClick={addFeature}>Add</button></div>{form.features?.length ? <div className='p4u-plans-feature-list'>{form.features.map((feature) => <em key={feature}>{feature}<button type='button' onClick={() => removeFeature(feature)} aria-label={`Remove ${feature}`}>×</button></em>)}</div> : null}</div>
        </div>
        <button type='button' className='p4u-plans-save' onClick={save}>Save Plan</button>
      </section>
    </div>
  );
}

export default function HomesPlansPricingLayer() {
  const [plans, setPlans] = useState([]);
  const [tab, setTab] = useState("owner");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listHomesPlans({ includeInactive: true, limit: 500, offset: 0 });
      setPlans((res.items || []).map(toUiPlan));
    } catch (e) {
      toast.error(errorMessage(e));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => PLAN_TYPES.reduce((acc, item) => ({ ...acc, [item.key]: plans.filter((plan) => plan.type === item.key).length }), {}), [plans]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((plan) => plan.type === tab && (!q || [plan.name, plan.description, plan.price].some((value) => String(value).toLowerCase().includes(q))));
  }, [plans, search, tab]);

  const savePlan = async (next) => {
    try {
      if (!next.name?.trim()) return toast.error("Plan name is required");
      const body = { planType: next.type, name: next.name, description: next.description, price: next.price, durationDays: next.duration, listingLimit: next.listings, contactReveals: next.contacts, visibilityBoost: next.boost, isActive: next.active, features: next.features || [] };
      next.id ? await updateHomesPlan(next.id, body) : await createHomesPlan(body);
      toast.success("Plan saved.");
      setTab(next.type);
      setModal(null);
      await load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const removePlan = async (id) => {
    try { await deleteHomesPlan(id); toast.success("Plan deleted."); await load(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className='p4u-plans-page'>
      <h1>Plans & Pricing</h1>
      <div className='p4u-plans-tabs' role='tablist' aria-label='Plan type'>{PLAN_TYPES.map((item) => <button key={item.key} type='button' className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>{item.label} ({counts[item.key] || 0})</button>)}</div>
      <section className='p4u-plans-card'>
        <div className='p4u-plans-toolbar'><label className='p4u-plans-search'><Icon icon='mdi:magnify' /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search...' /></label><button type='button' className='p4u-plans-add' onClick={() => setModal({ ...emptyPlan, type: tab })}><Icon icon='mdi:plus' /> Add {planTypeLabel(tab)} Plan</button></div>
        <div className='p4u-plans-table-wrap'><table className='p4u-plans-table'><thead><tr><th>Plan</th><th>Price</th><th>Duration</th><th>Listings</th><th>Contacts</th><th>Boost</th><th>Features</th><th>Active</th><th aria-label='Actions'></th></tr></thead><tbody>
          {loading ? <tr><td colSpan={9} className='p4u-plans-empty'>Loading...</td></tr> : null}
          {!loading && filtered.map((plan) => <tr key={plan.id}><td><strong>{plan.name}</strong><span>{plan.description}</span></td><td>{money(plan.price)}</td><td>{plan.duration} days</td><td>{plan.listings}</td><td>{plan.contacts}</td><td>{plan.boost ? <span className='p4u-plans-yes'>Yes</span> : 'No'}</td><td>{plan.features?.length || 0} features</td><td><span className='p4u-plans-status'>{plan.active ? 'Active' : 'Inactive'}</span></td><td><div className='p4u-plans-actions'><button type='button' onClick={() => setModal(plan)}>Edit</button><button type='button' className='is-danger' onClick={() => removePlan(plan.id)}>Delete</button></div></td></tr>)}
          {!loading && filtered.length === 0 ? <tr><td colSpan={9} className='p4u-plans-empty'>No results found</td></tr> : null}
        </tbody></table></div>
        <div className='p4u-plans-pagination'><span>{filtered.length ? `Showing 1-${filtered.length} of ${filtered.length}` : 'No results'}</span><div><button type='button' aria-label='Previous page'><Icon icon='mdi:chevron-left' /></button><strong>1</strong><button type='button' aria-label='Next page'><Icon icon='mdi:chevron-right' /></button></div></div>
      </section>
      {modal ? <PlanModal initial={modal} defaultType={tab} onClose={() => setModal(null)} onSave={savePlan} /> : null}
    </div>
  );
}