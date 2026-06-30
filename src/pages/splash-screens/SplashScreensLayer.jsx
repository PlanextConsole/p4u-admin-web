import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import FormModal from "../../components/admin/FormModal";

const baseScreens = [
  { id: "customer-fast", title: "Fast Delivery", tagline: "Get everything delivered to your doorstep", appType: "Customer", bgColor: "#009f98", order: 1, active: true },
  { id: "customer-shop", title: "Shop Smart", tagline: "Browse thousands of products & services", appType: "Customer", bgColor: "#001b2f", order: 2, active: true },
  { id: "vendor-grow", title: "Grow Your Business", tagline: "Manage your store, orders & settlements", appType: "Vendor", bgColor: "#08766d", order: 1, active: true },
  { id: "vendor-track", title: "Track Everything", tagline: "Inventory, payments & analytics at your fingertips", appType: "Vendor", bgColor: "#001b2f", order: 2, active: true },
];

const emptyScreen = { title: "", tagline: "", appType: "Both", bgColor: "#009999", order: 5, active: true };

function SplashModal({ screen, onClose, onSave }) {
  const [form, setForm] = useState(screen || emptyScreen);
  const isEdit = Boolean(screen);

  function update(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      title: form.title.trim(),
      tagline: form.tagline.trim(),
      order: Number(form.order) || 0,
    };
    if (!payload.title) return;
    onSave(payload);
  }

  return (
    <div className="p4u-ref-modal p4u-splash-modal">
      <button type="button" className="p4u-ref-modal-close" onClick={onClose} aria-label="Close"><Icon icon="mdi:close" /></button>
      <h2>{isEdit ? "Edit Splash Screen" : "Add Splash Screen"}</h2>
      <form onSubmit={submit}>
        <div className="p4u-ref-form-grid">
          <label className="p4u-ref-field">
            <span>Title *</span>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Fast Delivery" required autoFocus />
          </label>
          <label className="p4u-ref-field">
            <span>App Type</span>
            <select value={form.appType} onChange={(e) => update("appType", e.target.value)}>
              <option>Both</option>
              <option>Customer</option>
              <option>Vendor</option>
            </select>
          </label>
        </div>
        <label className="p4u-ref-field">
          <span>Tagline</span>
          <input value={form.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Get everything delivered..." />
        </label>
        <label className="p4u-ref-upload">
          <span>Image *</span>
          <div>
            <Icon icon="mdi:image-outline" />
            <strong>Select Image</strong>
            <small>Click to open Media Library</small>
          </div>
        </label>
        <div className="p4u-ref-form-grid">
          <label className="p4u-ref-field p4u-color-field">
            <span>Background Color</span>
            <div>
              <input type="color" value={form.bgColor} onChange={(e) => update("bgColor", e.target.value)} />
              <input value={form.bgColor} onChange={(e) => update("bgColor", e.target.value)} />
            </div>
          </label>
          <label className="p4u-ref-field">
            <span>Display Order</span>
            <input type="number" value={form.order} onChange={(e) => update("order", e.target.value)} />
          </label>
        </div>
        <label className="p4u-ref-switch-line">
          <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
          <span /> Active
        </label>
        <div className="p4u-ref-modal-footer">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function SplashScreensLayer() {
  const [screens, setScreens] = useState(baseScreens);
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);

  const rows = useMemo(() => {
    if (filter === "All") return screens;
    return screens.filter((screen) => screen.appType === filter || screen.appType === "Both");
  }, [screens, filter]);

  function saveScreen(payload) {
    if (modal?.mode === "edit") {
      setScreens((prev) => prev.map((screen) => screen.id === modal.screen.id ? { ...screen, ...payload } : screen));
    } else {
      setScreens((prev) => [{ ...payload, id: `splash-${Date.now()}` }, ...prev]);
    }
    setModal(null);
  }

  return (
    <div className="p4u-ref-page p4u-splash-page">
      <div className="p4u-ref-topline">
        <div className="p4u-ref-heading">
          <h1>Splash Screens</h1>
          <p>Manage app loading screens for customer and vendor apps</p>
        </div>
        <div className="p4u-splash-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option>
            <option>Customer</option>
            <option>Vendor</option>
            <option>Both</option>
          </select>
          <button type="button" onClick={() => setModal({ mode: "add" })}><Icon icon="ic:baseline-plus" /> Add Screen</button>
        </div>
      </div>

      <div className="p4u-splash-grid">
        {rows.map((screen) => (
          <article className="p4u-splash-card" key={screen.id}>
            <div className="p4u-splash-preview" style={{ background: screen.bgColor }}>
              <span className={`p4u-splash-badge is-${screen.appType.toLowerCase()}`}>
                <Icon icon={screen.appType === "Vendor" ? "mdi:storefront-outline" : "mdi:cellphone"} /> {screen.appType}
              </span>
              <div>
                <h2>{screen.title}</h2>
                <p>{screen.tagline}</p>
              </div>
              <div className="p4u-splash-card-actions">
                <button type="button" onClick={() => setModal({ mode: "edit", screen })} aria-label="Edit"><Icon icon="mdi:pencil-outline" /></button>
                <button type="button" className="danger" onClick={() => setScreens((prev) => prev.filter((row) => row.id !== screen.id))} aria-label="Delete"><Icon icon="mdi:trash-can-outline" /></button>
              </div>
            </div>
            <div className="p4u-splash-meta">
              <span><Icon icon="mdi:dots-grid" /> Order: {screen.order}</span>
              <label className="p4u-ref-switch mini">
                <input type="checkbox" checked={screen.active} onChange={(e) => setScreens((prev) => prev.map((row) => row.id === screen.id ? { ...row, active: e.target.checked } : row))} />
                <span />
              </label>
            </div>
          </article>
        ))}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="lg">
          <SplashModal screen={modal.screen} onClose={() => setModal(null)} onSave={saveScreen} />
        </FormModal>
      )}
    </div>
  );
}
