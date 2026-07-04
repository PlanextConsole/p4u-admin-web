import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { createHomesCmsContent, deleteHomesCmsContent, listHomesCmsContent, updateHomesCmsContent } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

const TABS = [
  { key: "banners", label: "Banners", icon: "mdi:image-outline", button: "Add Banner" },
  { key: "faqs", label: "FAQs", icon: "mdi:help-circle-outline", button: "Add FAQ" },
  { key: "announcements", label: "Announcements", icon: "mdi:bell-outline", button: "Add Announcement" },
  { key: "footer-links", label: "Footer Links", icon: "mdi:link-variant", button: "Add Footer Link" },
  { key: "seo-meta", label: "SEO Meta", icon: "mdi:file-document-outline", button: "Add SEO Meta" },
  { key: "page-content", label: "Page Content", icon: "mdi:file-document-outline", button: "Add Page Content" },
];

const emptyForm = { title: "", content: "", imageUrl: "", linkUrl: "", startDate: "", endDate: "", sortOrder: 0, isActive: true };

function errorMessage(e) {
  return e instanceof ApiError ? e.message : String(e?.message || e || "Something went wrong");
}

function shortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function Toggle({ checked, onChange }) {
  return <label className='p4u-homes-cms-switch'><input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} /><span />Active</label>;
}

function Editor({ value, onChange }) {
  const icons = ["mdi:format-bold", "mdi:format-italic", "mdi:format-underline", "mdi:format-strikethrough", "mdi:format-header-1", "mdi:format-header-2", "mdi:format-header-3", "mdi:format-text", "mdi:format-list-bulleted", "mdi:format-list-numbered", "mdi:format-align-left", "mdi:format-align-center", "mdi:format-align-justify", "mdi:link-variant", "mdi:undo", "mdi:redo"];
  return (
    <div className='p4u-homes-cms-editor'>
      <div>
        {icons.map((icon, index) => <button type='button' key={`${icon}-${index}`}><Icon icon={icon} /></button>)}
        <i />
        <button type='button' className='is-teal'><Icon icon='mdi:pencil-outline' /></button>
        <button type='button'><Icon icon='mdi:eye-outline' /></button>
      </div>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder='Content...' />
    </div>
  );
}

function ContentModal({ tab, initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyForm, ...(initial || {}) });
  const type = TABS.find((item) => item.key === tab) || TABS[0];
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const showImage = tab === "banners" || tab === "announcements";
  const showLink = tab === "banners" || tab === "announcements" || tab === "footer-links";
  const showDates = tab === "banners" || tab === "announcements";

  return (
    <div className='p4u-homes-cms-modal-backdrop' role='presentation' onClick={onClose}>
      <section className='p4u-homes-cms-modal' role='dialog' aria-modal='true' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='p4u-homes-cms-close' onClick={onClose} aria-label='Close'><Icon icon='mdi:close' /></button>
        <h2>{initial?.id ? `Edit ${type.label}` : "Add Content"}</h2>
        <div className='p4u-homes-cms-form'>
          <label><span>Title *</span><input value={form.title || ""} onChange={(e) => setField("title", e.target.value)} autoFocus /></label>
          <label><span>Content</span><Editor value={form.content} onChange={(value) => setField("content", value)} /></label>
          {showImage ? <label><span>Image URL</span><input value={form.imageUrl || ""} onChange={(e) => setField("imageUrl", e.target.value)} /></label> : null}
          {showLink ? <label><span>Link URL</span><input value={form.linkUrl || ""} onChange={(e) => setField("linkUrl", e.target.value)} /></label> : null}
          {showDates ? <div className='p4u-homes-cms-grid'><label><span>Start Date</span><input type='date' value={form.startDate || ""} onChange={(e) => setField("startDate", e.target.value)} /></label><label><span>End Date</span><input type='date' value={form.endDate || ""} onChange={(e) => setField("endDate", e.target.value)} /></label></div> : null}
          <label><span>Sort Order</span><input value={form.sortOrder ?? 0} onChange={(e) => setField("sortOrder", e.target.value)} /></label>
          <Toggle checked={form.isActive !== false} onChange={(value) => setField("isActive", value)} />
          <button type='button' className='p4u-homes-cms-save' onClick={() => onSave({ ...form, contentType: tab, sortOrder: Number(form.sortOrder || 0) })}>Save</button>
        </div>
      </section>
    </div>
  );
}

export default function HomesCmsLayer() {
  const [tab, setTab] = useState("banners");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const activeTab = TABS.find((item) => item.key === tab) || TABS[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listHomesCmsContent({ type: tab, includeInactive: true, limit: 500, offset: 0 });
      setItems(res.items || []);
    } catch (e) {
      toast.error(errorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => !q || [item.title, item.content].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [items, search]);

  const save = async (body) => {
    try {
      if (!body.title?.trim()) return toast.error("Title is required");
      body.id ? await updateHomesCmsContent(body.id, body) : await createHomesCmsContent(body);
      toast.success("Content saved.");
      setModal(null);
      await load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const remove = async (id) => {
    try {
      await deleteHomesCmsContent(id);
      toast.success("Content deleted.");
      await load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className='p4u-homes-cms-page'>
      <h1>Homes CMS</h1>
      <div className='p4u-homes-cms-tabs'>
        {TABS.map((item) => <button type='button' key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}><Icon icon={item.icon} />{item.label}</button>)}
      </div>
      <section className='p4u-homes-cms-card'>
        <div className='p4u-homes-cms-toolbar'>
          <label className='p4u-homes-cms-search'><Icon icon='mdi:magnify' /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search...' /></label>
          <button type='button' className='p4u-homes-cms-add' onClick={() => setModal(emptyForm)}><Icon icon='mdi:plus' />{activeTab.button}</button>
        </div>
        <div className='p4u-homes-cms-table-wrap'>
          <table className='p4u-homes-cms-table'>
            <thead><tr><th>Title</th><th>Content</th><th>Order</th><th>Status</th><th>Start</th><th>End</th><th></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className='p4u-homes-cms-empty'>Loading...</td></tr> : null}
              {!loading ? rows.map((item) => <tr key={item.id}><td>{item.title}</td><td>{item.content || item.linkUrl || '-'}</td><td>{item.sortOrder}</td><td><span className='p4u-homes-cms-status'>{item.isActive ? 'Active' : 'Inactive'}</span></td><td>{shortDate(item.startDate)}</td><td>{shortDate(item.endDate)}</td><td><div className='p4u-homes-cms-actions'><button onClick={() => setModal(item)}>Edit</button><button className='is-danger' onClick={() => remove(item.id)}>Delete</button></div></td></tr>) : null}
              {!loading && rows.length === 0 ? <tr><td colSpan={7} className='p4u-homes-cms-empty'>No results found</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className='p4u-homes-cms-pagination'><span>{rows.length ? `Showing 1-${rows.length} of ${rows.length}` : 'No results'}</span><div><button><Icon icon='mdi:chevron-left' /></button><strong>1</strong><button><Icon icon='mdi:chevron-right' /></button></div></div>
      </section>
      {modal ? <ContentModal tab={tab} initial={modal.id ? modal : null} onClose={() => setModal(null)} onSave={save} /> : null}
    </div>
  );
}