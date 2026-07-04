import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const SCORE_KEYS = ["connectivity", "safety", "amenities", "airQuality", "water", "power"];
const SCORE_LABELS = {
  connectivity: "Connectivity",
  safety: "Safety",
  amenities: "Amenities",
  airQuality: "Air Quality",
  water: "Water",
  power: "Power",
};

const SEED_LOCALITIES = [
  { id: "loc-001", name: "RS Puram", city: "Coimbatore", popular: true, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-002", name: "Gandhipuram", city: "Coimbatore", popular: true, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-003", name: "Peelamedu", city: "Coimbatore", popular: true, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-004", name: "Saibaba Colony", city: "Coimbatore", popular: true, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-005", name: "Singanallur", city: "Coimbatore", popular: false, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-006", name: "Ganapathy", city: "Coimbatore", popular: false, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-007", name: "Vadavalli", city: "Coimbatore", popular: false, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-008", name: "Thudiyalur", city: "Coimbatore", popular: false, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-009", name: "Anna Nagar", city: "Chennai", popular: true, avgRent: "-", avgSale: "-", status: "Active" },
  { id: "loc-010", name: "T Nagar", city: "Chennai", popular: true, avgRent: "-", avgSale: "-", status: "Active" },
];

const emptyForm = {
  id: "",
  name: "",
  city: "",
  avgRent: "0",
  avgSale: "0",
  popular: false,
  status: "Active",
  scores: SCORE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
  seoTitle: "Properties in [Locality] | P4U Homes",
  seoDescription: "Find apartments, houses for rent & sale in...",
};

function scoreAverage(scores) {
  const values = SCORE_KEYS.map((key) => Number(scores?.[key] || 0));
  const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
  return Number.isFinite(avg) ? avg : 0;
}

function ScorePill({ value }) {
  return <span className='p4u-localities-score'>{Number(value || 0).toFixed(1)}/10</span>;
}

function LocalityModal({ initial, onClose, onSave }) {
  const [tab, setTab] = useState("details");
  const [form, setForm] = useState(initial || emptyForm);
  const composite = scoreAverage(form.scores);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setScore = (key, value) => setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: Number(value) } }));

  const save = () => {
    const next = {
      ...form,
      id: form.id || `loc-${Date.now()}`,
      avgRent: form.avgRent ? `₹${Number(String(form.avgRent).replace(/[^0-9.]/g, "") || 0).toLocaleString("en-IN")}` : "-",
      avgSale: form.avgSale ? `₹${Number(String(form.avgSale).replace(/[^0-9.]/g, "") || 0).toLocaleString("en-IN")}` : "-",
      status: form.status || "Active",
    };
    onSave(next);
  };

  return (
    <div className='p4u-localities-modal-backdrop' role='presentation' onClick={onClose}>
      <section className='p4u-localities-modal' role='dialog' aria-modal='true' aria-label='Locality form' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='p4u-localities-modal-close' onClick={onClose} aria-label='Close'>
          <Icon icon='mdi:close' />
        </button>
        <h2>{form.id ? "Edit Locality" : "Add Locality"}</h2>

        <div className='p4u-localities-modal-tabs' role='tablist'>
          <button type='button' className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>Details</button>
          <button type='button' className={tab === "life" ? "active" : ""} onClick={() => setTab("life")}>Life Score</button>
          <button type='button' className={tab === "seo" ? "active" : ""} onClick={() => setTab("seo")}>SEO</button>
        </div>

        {tab === "details" ? (
          <div className='p4u-localities-form'>
            <label className='is-full'><span>Name *</span><input value={form.name} onChange={(e) => setField("name", e.target.value)} /></label>
            <label className='is-full'><span>City *</span><input value={form.city} onChange={(e) => setField("city", e.target.value)} /></label>
            <div className='p4u-localities-form-grid'>
              <label><span>Avg Rent (₹/mo)</span><input value={String(form.avgRent).replace(/^₹/, "")} onChange={(e) => setField("avgRent", e.target.value)} /></label>
              <label><span>Avg Sale Price (₹)</span><input value={String(form.avgSale).replace(/^₹/, "")} onChange={(e) => setField("avgSale", e.target.value)} /></label>
            </div>
            <label className='p4u-localities-switch'><input type='checkbox' checked={form.popular} onChange={(e) => setField("popular", e.target.checked)} /><span />Popular Locality</label>
          </div>
        ) : null}

        {tab === "life" ? (
          <div className='p4u-localities-score-form'>
            <p>Override Life Score categories (0–10)</p>
            {SCORE_KEYS.map((key) => (
              <label key={key}>
                <span>{SCORE_LABELS[key]}</span>
                <strong>{Number(form.scores?.[key] || 0)}/10</strong>
                <input type='range' min='0' max='10' step='1' value={Number(form.scores?.[key] || 0)} onChange={(e) => setScore(key, e.target.value)} />
              </label>
            ))}
            <div className='p4u-localities-composite'><span>Composite Score</span><strong>{composite.toFixed(1)}/10</strong></div>
          </div>
        ) : null}

        {tab === "seo" ? (
          <div className='p4u-localities-form'>
            <label className='is-full'><span>SEO Title</span><input value={form.seoTitle} onChange={(e) => setField("seoTitle", e.target.value)} /></label>
            <label className='is-full'><span>SEO Description</span><input value={form.seoDescription} onChange={(e) => setField("seoDescription", e.target.value)} /></label>
          </div>
        ) : null}

        <button type='button' className='p4u-localities-save' onClick={save}>Save Locality</button>
      </section>
    </div>
  );
}

export default function HomesLocalitiesLayer() {
  const [items, setItems] = useState(SEED_LOCALITIES.map((item) => ({ ...emptyForm, ...item })));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => [item.name, item.city, item.status].some((value) => String(value).toLowerCase().includes(q)));
  }, [items, search]);

  const saveLocality = (next) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === next.id);
      return exists ? prev.map((item) => (item.id === next.id ? next : item)) : [next, ...prev];
    });
    setModal(null);
  };

  const deleteLocality = (id) => setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <div className='p4u-localities-page'>
      <section className='p4u-localities-card'>
        <div className='p4u-localities-toolbar'>
          <label className='p4u-localities-search'>
            <Icon icon='mdi:magnify' />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search...' />
          </label>
          <button type='button' className='p4u-localities-add' onClick={() => setModal(emptyForm)}>
            <Icon icon='mdi:plus' /> Add Locality
          </button>
        </div>

        <div className='p4u-localities-table-wrap'>
          <table className='p4u-localities-table'>
            <thead>
              <tr>
                <th>Locality</th>
                <th>City</th>
                <th>Popular</th>
                <th>Avg Rent</th>
                <th>Avg Sale</th>
                <th>Life Score</th>
                <th>Status</th>
                <th aria-label='Actions'></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.city}</td>
                  <td>{item.popular ? <Icon icon='mdi:star' className='p4u-localities-star' /> : <span className='p4u-localities-no'>No</span>}</td>
                  <td>{item.avgRent || '-'}</td>
                  <td>{item.avgSale || '-'}</td>
                  <td><ScorePill value={scoreAverage(item.scores)} /></td>
                  <td><span className='p4u-localities-status'>{item.status}</span></td>
                  <td>
                    <div className='p4u-localities-actions'>
                      <button type='button' onClick={() => setModal(item)}>Edit</button>
                      <button type='button' className='is-danger' onClick={() => deleteLocality(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? <tr><td colSpan={8} className='p4u-localities-empty'>No localities found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {modal ? <LocalityModal initial={modal} onClose={() => setModal(null)} onSave={saveLocality} /> : null}
    </div>
  );
}