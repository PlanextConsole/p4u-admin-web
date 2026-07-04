import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  createHomesAmenity,
  createHomesFilterOption,
  deleteHomesAmenity,
  deleteHomesFilterOption,
  listHomesAmenities,
  listHomesFilterOptions,
  updateHomesAmenity,
  updateHomesFilterOption,
} from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

const emptyAmenity = { name: "", icon: "shield", category: "General", sortOrder: 0, isActive: true };
const emptyOption = { filterType: "property type", label: "", value: "", sortOrder: 0, isActive: true };
const FILTER_TYPES = ["property type", "furnishing", "bhk", "tenant preference", "age", "facing"];
const AMENITY_CATEGORIES = ["General", "Security", "Recreation", "Convenience", "Parking", "Utilities"];

function errorMessage(e) {
  return e instanceof ApiError ? e.message : String(e?.message || e || "Something went wrong");
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className='p4u-haf-switch'>
      <input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
      {label}
    </label>
  );
}

function AmenityModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || emptyAmenity);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <div className='p4u-haf-modal-backdrop' role='presentation' onClick={onClose}>
      <section className='p4u-haf-modal' role='dialog' aria-modal='true' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='p4u-haf-modal-close' onClick={onClose} aria-label='Close'><Icon icon='mdi:close' /></button>
        <h2>{form.id ? "Edit Amenity" : "Add Amenity"}</h2>
        <div className='p4u-haf-form'>
          <label><span>Name *</span><input value={form.name} onChange={(e) => setField("name", e.target.value)} autoFocus /></label>
          <label><span>Icon (lucide name)</span><input value={form.icon || ""} onChange={(e) => setField("icon", e.target.value)} placeholder='shield' /></label>
          <label><span>Category</span><select value={form.category || "General"} onChange={(e) => setField("category", e.target.value)}>{AMENITY_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span>Sort Order</span><input value={form.sortOrder ?? 0} onChange={(e) => setField("sortOrder", e.target.value)} /></label>
          <Toggle checked={form.isActive !== false} onChange={(value) => setField("isActive", value)} label='Active' />
          <button type='button' className='p4u-haf-save' onClick={() => onSave({ ...form, sortOrder: Number(form.sortOrder || 0) })}>Save</button>
        </div>
      </section>
    </div>
  );
}

function OptionModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || emptyOption);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <div className='p4u-haf-modal-backdrop' role='presentation' onClick={onClose}>
      <section className='p4u-haf-modal is-option' role='dialog' aria-modal='true' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='p4u-haf-modal-close' onClick={onClose} aria-label='Close'><Icon icon='mdi:close' /></button>
        <h2>{form.id ? "Edit Filter Option" : "Add Filter Option"}</h2>
        <div className='p4u-haf-form'>
          <label><span>Filter Type *</span><select value={form.filterType || "property type"} onChange={(e) => setField("filterType", e.target.value)} autoFocus>{FILTER_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span>Label *</span><input value={form.label || ""} onChange={(e) => setField("label", e.target.value)} placeholder='2 BHK' /></label>
          <label><span>Value *</span><input value={form.value || ""} onChange={(e) => setField("value", e.target.value)} placeholder='2bhk' /></label>
          <label><span>Sort Order</span><input value={form.sortOrder ?? 0} onChange={(e) => setField("sortOrder", e.target.value)} /></label>
          <Toggle checked={form.isActive !== false} onChange={(value) => setField("isActive", value)} label='Active' />
          <button type='button' className='p4u-haf-save' onClick={() => onSave({ ...form, sortOrder: Number(form.sortOrder || 0) })}>Save</button>
        </div>
      </section>
    </div>
  );
}

export default function HomesAmenitiesFiltersLayer() {
  const [tab, setTab] = useState("amenities");
  const [amenities, setAmenities] = useState([]);
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, f] = await Promise.all([
        listHomesAmenities({ includeInactive: true, limit: 500, offset: 0 }),
        listHomesFilterOptions({ includeInactive: true, limit: 500, offset: 0 }),
      ]);
      setAmenities(a.items || []);
      setOptions(f.items || []);
    } catch (e) {
      toast.error(errorMessage(e));
      setAmenities([]);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredAmenities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return amenities.filter((item) => !q || [item.name, item.icon, item.category].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [amenities, search]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.filter((item) => !q || [item.filterType, item.label, item.value].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [options, search]);

  const saveAmenity = async (body) => {
    try {
      if (!body.name?.trim()) return toast.error("Name is required");
      body.id ? await updateHomesAmenity(body.id, body) : await createHomesAmenity(body);
      toast.success("Amenity saved.");
      setModal(null);
      await load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const saveOption = async (body) => {
    try {
      if (!body.label?.trim() || !body.value?.trim()) return toast.error("Label and value are required");
      body.id ? await updateHomesFilterOption(body.id, body) : await createHomesFilterOption(body);
      toast.success("Filter option saved.");
      setModal(null);
      await load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const remove = async (kind, id) => {
    try {
      if (kind === "amenity") await deleteHomesAmenity(id);
      else await deleteHomesFilterOption(id);
      toast.success("Deleted.");
      await load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const rows = tab === "amenities" ? filteredAmenities : filteredOptions;

  return (
    <div className='p4u-haf-page'>
      <h1>Amenities & Filter Options</h1>
      <div className='p4u-haf-tabs'>
        <button type='button' className={tab === "amenities" ? "active" : ""} onClick={() => setTab("amenities")}>Amenities ({amenities.length})</button>
        <button type='button' className={tab === "options" ? "active" : ""} onClick={() => setTab("options")}>Filter Options ({options.length})</button>
      </div>

      <section className='p4u-haf-card'>
        <div className='p4u-haf-toolbar'>
          <label className='p4u-haf-search'><Icon icon='mdi:magnify' /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search...' /></label>
          <button type='button' className='p4u-haf-add' onClick={() => setModal(tab === "amenities" ? { type: "amenity", data: emptyAmenity } : { type: "option", data: emptyOption })}>
            <Icon icon='mdi:plus' /> {tab === "amenities" ? "Add Amenity" : "Add Option"}
          </button>
        </div>

        <div className='p4u-haf-table-wrap'>
          <table className='p4u-haf-table'>
            <thead>
              {tab === "amenities" ? <tr><th>Amenity</th><th>Icon</th><th>Category</th><th>Order</th><th>Active</th><th></th></tr> : <tr><th>Type</th><th>Label</th><th>Value</th><th>Order</th><th>Active</th><th></th></tr>}
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className='p4u-haf-empty'>Loading...</td></tr> : null}
              {!loading && tab === "amenities" ? rows.map((item) => (
                <tr key={item.id}><td>{item.name}</td><td><code>{item.icon || '-'}</code></td><td><span className='p4u-haf-pill'>{item.category}</span></td><td>{item.sortOrder}</td><td><span className='p4u-haf-status'>{item.isActive ? 'Active' : 'Inactive'}</span></td><td><div className='p4u-haf-actions'><button onClick={() => setModal({ type: "amenity", data: item })}>Edit</button><button className='is-danger' onClick={() => remove("amenity", item.id)}>Delete</button></div></td></tr>
              )) : null}
              {!loading && tab === "options" ? rows.map((item) => (
                <tr key={item.id}><td><span className='p4u-haf-pill'>{item.filterType}</span></td><td>{item.label}</td><td><code>{item.value}</code></td><td>{item.sortOrder}</td><td><span className='p4u-haf-status'>{item.isActive ? 'Active' : 'Inactive'}</span></td><td><div className='p4u-haf-actions'><button onClick={() => setModal({ type: "option", data: item })}>Edit</button><button className='is-danger' onClick={() => remove("option", item.id)}>Delete</button></div></td></tr>
              )) : null}
              {!loading && rows.length === 0 ? <tr><td colSpan={6} className='p4u-haf-empty'>No results found</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {modal?.type === "amenity" ? <AmenityModal initial={modal.data} onClose={() => setModal(null)} onSave={saveAmenity} /> : null}
      {modal?.type === "option" ? <OptionModal initial={modal.data} onClose={() => setModal(null)} onSave={saveOption} /> : null}
    </div>
  );
}