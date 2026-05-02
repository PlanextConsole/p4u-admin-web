import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";

const TABS = [
  { key: "hero", label: "Hero Banners" },
  { key: "content", label: "Content Sections" },
  { key: "video", label: "Video Ads" },
];

function emptyForm() {
  return {
    title: "",
    subtitle: "",
    mediaType: "image",
    displayOrder: 0,
    desktopImageUrl: "",
    mobileImageUrl: "",
    ctaText: "",
    ctaLink: "",
    redirectType: "external",
    redirectId: "",
    themeHeaderColor: "",
    themeBgColor: "",
    themeButtonColor: "",
    backgroundGradient: "",
    festivalTag: "",
    startDate: "",
    endDate: "",
    isActive: true,
  };
}

function bannerToForm(b) {
  const m = b.metadata || {};
  return {
    title: b.title || "",
    subtitle: String(m.subtitle || ""),
    mediaType: m.mediaType === "video" ? "video" : "image",
    displayOrder: b.sortOrder ?? 0,
    desktopImageUrl: String(m.desktopImageUrl || b.imageUrl || ""),
    mobileImageUrl: String(m.mobileImageUrl || ""),
    ctaText: String(m.ctaText || ""),
    ctaLink: String(m.ctaLink || b.redirectUrl || ""),
    redirectType: m.redirectType === "internal" ? "internal" : "external",
    redirectId: String(m.redirectId || ""),
    themeHeaderColor: String(m.themeHeaderColor || ""),
    themeBgColor: String(m.themeBgColor || ""),
    themeButtonColor: String(m.themeButtonColor || ""),
    backgroundGradient: String(m.backgroundGradient || ""),
    festivalTag: String(m.festivalTag || ""),
    startDate: m.startDate ? String(m.startDate).slice(0, 16) : "",
    endDate: m.endDate ? String(m.endDate).slice(0, 16) : "",
    isActive: b.isActive !== false,
  };
}

function buildMetadata(form, cmsSlot, existingMeta = {}) {
  return {
    homepageCMS: true,
    cmsSlot,
    subtitle: form.subtitle.trim() || null,
    mediaType: form.mediaType,
    desktopImageUrl: form.desktopImageUrl.trim() || null,
    mobileImageUrl: form.mobileImageUrl.trim() || null,
    ctaText: form.ctaText.trim() || null,
    ctaLink: form.ctaLink.trim() || null,
    redirectType: form.redirectType,
    redirectId: form.redirectId.trim() || null,
    themeHeaderColor: form.themeHeaderColor.trim() || null,
    themeBgColor: form.themeBgColor.trim() || null,
    themeButtonColor: form.themeButtonColor.trim() || null,
    backgroundGradient: form.backgroundGradient.trim() || null,
    festivalTag: form.festivalTag.trim() || null,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    impressions: typeof existingMeta.impressions === "number" ? existingMeta.impressions : 0,
    clicks: typeof existingMeta.clicks === "number" ? existingMeta.clicks : 0,
  };
}

const HomepageCmsLayer = () => {
  const [tab, setTab] = useState("hero");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [pendingDesktop, setPendingDesktop] = useState(null);
  const [pendingMobile, setPendingMobile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listBanners();
      setItems(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((b) => {
        const m = b.metadata || {};
        if (m.homepageCMS !== true) return false;
        const slot = m.cmsSlot || "hero";
        if (slot !== tab) return false;
        if (!q) return true;
        return (
          (b.title || "").toLowerCase().includes(q) ||
          String(m.subtitle || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [items, tab, search]);

  const counts = useMemo(() => {
    const c = { hero: 0, content: 0, video: 0 };
    items.forEach((b) => {
      const m = b.metadata || {};
      if (m.homepageCMS !== true) return;
      const slot = m.cmsSlot || "hero";
      if (slot in c) c[slot] += 1;
    });
    return c;
  }, [items]);

  const openAdd = () => {
    setForm(emptyForm());
    setPendingDesktop(null);
    setPendingMobile(null);
    setModal({ mode: "add" });
  };

  const openEdit = (row) => {
    setForm(bannerToForm(row));
    setPendingDesktop(null);
    setPendingMobile(null);
    setModal({ mode: "edit", id: row.id, row });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this homepage item?")) return;
    try {
      await deleteBanner(id);
      toast.success("Deleted.");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const patchActive = async (row, next) => {
    try {
      await updateBanner(row.id, { isActive: next });
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const move = async (index, dir) => {
    const list = [...tabItems];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[index];
    const b = list[j];
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    try {
      await updateBanner(a.id, { sortOrder: orderB });
      await updateBanner(b.id, { sortOrder: orderA });
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : name === "displayOrder" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error("Title is required.");
      return;
    }
    let desktopUrl = form.desktopImageUrl.trim();
    if (pendingDesktop) {
      try {
        const up = await uploadFile(pendingDesktop);
        desktopUrl = up.url || desktopUrl;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : String(err));
        return;
      }
    }
    if (!desktopUrl) {
      toast.error("Desktop image is required (URL or upload).");
      return;
    }
    let mobileUrl = form.mobileImageUrl.trim();
    if (pendingMobile) {
      try {
        const up = await uploadFile(pendingMobile);
        mobileUrl = up.url || mobileUrl;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : String(err));
        return;
      }
    }

    const existingMeta = modal?.row?.metadata || {};
    const cmsSlot =
      modal?.mode === "edit" && modal?.row?.metadata && typeof modal.row.metadata.cmsSlot === "string"
        ? modal.row.metadata.cmsSlot
        : tab;
    const metadata = buildMetadata(
      { ...form, desktopImageUrl: desktopUrl, mobileImageUrl: mobileUrl },
      cmsSlot,
      existingMeta,
    );

    setSubmitting(true);
    try {
      const body = {
        title,
        imageUrl: desktopUrl,
        redirectUrl: form.ctaLink.trim() || null,
        sortOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
        metadata,
      };
      if (modal?.mode === "edit" && modal.id) {
        await updateBanner(modal.id, body);
        toast.success("Saved.");
      } else {
        await createBanner(body);
        toast.success("Created.");
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const addLabel = tab === "hero" ? "Add Banner" : tab === "content" ? "Add Section" : "Add Video Ad";

  return (
    <div className='card h-100 p-0 radius-16 border-0 shadow-sm'>
      <div className='card-body p-24'>
        <div className='mb-20'>
          <h3 className='fw-bold mb-4'>Homepage CMS</h3>
          <p className='text-secondary-light mb-0'>
            Manage dynamic homepage banners, sections, and video ads. Items here are stored as homepage banners (separate from the generic Banners list).
          </p>
        </div>

        <div className='bg-primary-50 radius-12 p-6 d-flex flex-wrap gap-6 mb-20'>
          {TABS.map((t) => (
            <button
              key={t.key}
              type='button'
              onClick={() => setTab(t.key)}
              className={`btn border-0 radius-10 px-16 py-8 ${tab === t.key ? "bg-white fw-semibold text-primary-600" : "bg-transparent text-secondary-light"}`}
            >
              {t.label} ({counts[t.key] ?? 0})
            </button>
          ))}
        </div>

        <div className='card radius-12 border-0 mb-16'>
          <div className='card-body p-16 d-flex flex-wrap align-items-center gap-10 justify-content-between'>
            <div className='input-group radius-10 p4u-filter-search' style={{ minWidth: 160, maxWidth: 320 }}>
              <span className='input-group-text bg-white border-end-0'><Icon icon='mdi:magnify' /></span>
              <input
                type='search'
                className='form-control border-start-0 h-40-px'
                placeholder='Search...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type='button' onClick={openAdd} className='btn btn-primary radius-10 px-20 d-flex align-items-center gap-8'>
              <Icon icon='ic:baseline-plus' /> {addLabel}
            </button>
          </div>
        </div>

        {error && (
          <div className='alert alert-danger radius-12 mb-16' role='alert'>{error}</div>
        )}

        {loading ? (
          <p className='text-secondary-light mb-0'>Loading...</p>
        ) : (
          <section>
            <h5 className='fw-semibold text-primary-light mb-12'>
              {tab === "hero" && "Hero carousel banners"}
              {tab === "content" && "Content sections"}
              {tab === "video" && "Video ads"}
              {" "}
              <span className='text-secondary-light fw-normal'>({tabItems.length})</span>
            </h5>
            {tabItems.length === 0 ? (
              <div className='text-center py-40 text-secondary-light border border-dashed radius-12'>
                No items in this tab yet. Use &quot;{addLabel}&quot; to create one.
              </div>
            ) : (
              <ul className='list-unstyled d-flex flex-column gap-12 mb-0'>
                {tabItems.map((row, idx) => {
                  const m = row.metadata || {};
                  const img = m.desktopImageUrl || row.imageUrl;
                  const media = (m.mediaType || "image").toUpperCase();
                  return (
                    <li key={row.id} className='border radius-12 p-16 bg-base'>
                      <div className='d-flex flex-wrap align-items-start gap-16'>
                        <div
                          className='radius-10 bg-neutral-100 flex-shrink-0 overflow-hidden d-flex align-items-center justify-content-center border'
                          style={{ width: 120, height: 72 }}
                        >
                          {img ? (
                            <img src={img} alt='' className='w-100 h-100 object-fit-cover' onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <Icon icon='mdi:image-off-outline' className='text-3xl text-secondary-light' />
                          )}
                        </div>
                        <div className='flex-grow-1 min-w-0'>
                          <div className='fw-semibold text-primary-light'>{row.title}</div>
                          <div className='text-sm text-secondary-light mt-4'>
                            {media} · Order: {row.sortOrder ?? 0}
                            {m.subtitle ? ` · ${m.subtitle}` : ""}
                          </div>
                          <div className='text-xs text-neutral-500 mt-4'>
                            {m.impressions ?? 0} impressions · {m.clicks ?? 0} clicks
                          </div>
                        </div>
                        <div className='d-flex align-items-center gap-8 flex-shrink-0 ms-auto'>
                          <button type='button' className='btn btn-light border radius-8 p-8' disabled={idx === 0} onClick={() => move(idx, -1)} title='Move up'>
                            <Icon icon='mdi:chevron-up' />
                          </button>
                          <button type='button' className='btn btn-light border radius-8 p-8' disabled={idx === tabItems.length - 1} onClick={() => move(idx, 1)} title='Move down'>
                            <Icon icon='mdi:chevron-down' />
                          </button>
                          <div className='form-check form-switch'>
                            <input
                              className='form-check-input'
                              type='checkbox'
                              checked={row.isActive !== false}
                              onChange={(e) => patchActive(row, e.target.checked)}
                            />
                          </div>
                          <button type='button' className='btn btn-light border radius-8 p-8' onClick={() => openEdit(row)} title='Edit'>
                            <Icon icon='lucide:edit' />
                          </button>
                          <button type='button' className='btn btn-light border radius-8 p-8 text-danger-600' onClick={() => handleDelete(row.id)} title='Delete'>
                            <Icon icon='fluent:delete-24-regular' />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => !submitting && setModal(null)} size='xl'>
          <form onSubmit={handleSubmit} className='d-flex flex-column gap-12'>
            <h4 className='fw-bold mb-0'>{modal.mode === "edit" ? "Edit item" : addLabel}</h4>
            <div className='row g-12'>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>Title *</label>
                <input className='form-control radius-10' name='title' value={form.title} onChange={handleChange} required />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>Subtitle</label>
                <input className='form-control radius-10' name='subtitle' value={form.subtitle} onChange={handleChange} />
              </div>
              <div className='col-md-4'>
                <label className='form-label fw-semibold text-sm'>Media type</label>
                <select className='form-select radius-10' name='mediaType' value={form.mediaType} onChange={handleChange}>
                  <option value='image'>Image</option>
                  <option value='video'>Video</option>
                </select>
              </div>
              <div className='col-md-4'>
                <label className='form-label fw-semibold text-sm'>Display order</label>
                <input className='form-control radius-10' type='number' name='displayOrder' value={form.displayOrder} onChange={handleChange} min={0} />
              </div>
              <div className='col-md-4 d-flex align-items-end'>
                <div className='form-check form-switch w-100'>
                  <input className='form-check-input' type='checkbox' name='isActive' checked={form.isActive} onChange={handleChange} id='cms-active' />
                  <label className='form-check-label fw-medium' htmlFor='cms-active'>Active</label>
                </div>
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>Desktop image *</label>
                <input className='form-control radius-10 mb-8' name='desktopImageUrl' value={form.desktopImageUrl} onChange={handleChange} placeholder='https://...' />
                <input type='file' className='form-control radius-10' accept='image/*' onChange={(e) => setPendingDesktop(e.target.files?.[0] || null)} />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>Mobile image (optional)</label>
                <input className='form-control radius-10 mb-8' name='mobileImageUrl' value={form.mobileImageUrl} onChange={handleChange} placeholder='https://...' />
                <input type='file' className='form-control radius-10' accept='image/*' onChange={(e) => setPendingMobile(e.target.files?.[0] || null)} />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>CTA text</label>
                <input className='form-control radius-10' name='ctaText' value={form.ctaText} onChange={handleChange} />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>CTA link</label>
                <input className='form-control radius-10' name='ctaLink' value={form.ctaLink} onChange={handleChange} />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>Redirect type</label>
                <select className='form-select radius-10' name='redirectType' value={form.redirectType} onChange={handleChange}>
                  <option value='external'>External URL</option>
                  <option value='internal'>Internal (ID)</option>
                </select>
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>Redirect ID</label>
                <input className='form-control radius-10' name='redirectId' value={form.redirectId} onChange={handleChange} placeholder='Product / category / service ID' />
              </div>
              <div className='col-md-4'>
                <label className='form-label fw-semibold text-sm'>Theme header color</label>
                <input className='form-control radius-10' name='themeHeaderColor' value={form.themeHeaderColor} onChange={handleChange} placeholder='#FFFFFF' />
              </div>
              <div className='col-md-4'>
                <label className='form-label fw-semibold text-sm'>Theme BG color</label>
                <input className='form-control radius-10' name='themeBgColor' value={form.themeBgColor} onChange={handleChange} placeholder='#149A9A' />
              </div>
              <div className='col-md-4'>
                <label className='form-label fw-semibold text-sm'>Theme button color</label>
                <input className='form-control radius-10' name='themeButtonColor' value={form.themeButtonColor} onChange={handleChange} placeholder='#1CCAD8' />
              </div>
              <div className='col-12'>
                <label className='form-label fw-semibold text-sm'>Background gradient (CSS)</label>
                <input className='form-control radius-10' name='backgroundGradient' value={form.backgroundGradient} onChange={handleChange} placeholder='linear-gradient(135deg, #667eea, #764ba2)' />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>Start date</label>
                <input className='form-control radius-10' type='datetime-local' name='startDate' value={form.startDate} onChange={handleChange} />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>End date</label>
                <input className='form-control radius-10' type='datetime-local' name='endDate' value={form.endDate} onChange={handleChange} />
              </div>
              <div className='col-md-6'>
                <label className='form-label fw-semibold text-sm'>Festival tag</label>
                <input className='form-control radius-10' name='festivalTag' value={form.festivalTag} onChange={handleChange} placeholder='e.g. Diwali, Christmas' />
              </div>
            </div>
            <div className='d-flex justify-content-end gap-10 pt-8 border-top'>
              <button type='button' className='btn btn-light border radius-10' onClick={() => setModal(null)} disabled={submitting}>Cancel</button>
              <button type='submit' className='btn btn-primary radius-10' disabled={submitting}>{submitting ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
};

export default HomepageCmsLayer;
