import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  createBanner,
  deleteBanner,
  listCategoriesForProducts,
  listCatalogServices,
  listBanners,
  updateBanner,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_OR_VIDEO_ACCEPT, IMAGE_ACCEPT } from "../../lib/acceptImages";
import FormModal from "../../components/admin/FormModal";

const TABS = [
  { key: "hero", label: "Hero Banners", icon: "mdi:image-outline" },
  { key: "content", label: "Content Sections", icon: "mdi:view-grid-outline" },
  { key: "video", label: "Video Ads", icon: "mdi:video-outline" },
];

function emptyForm() {
  return {
    title: "",
    subtitle: "",
    mediaType: "image",
    sectionType: "product_slider",
    displayOrder: 0,
    desktopImageUrl: "",
    mobileImageUrl: "",
    videoUrl: "",
    thumbnailUrl: "",
    durationSec: 0,
    ctaText: "",
    ctaLink: "",
    redirectType: "external",
    redirectId: "",
    linkType: "none",
    linkTarget: "",
    targetLocation: "",
    targetSegment: "all_users",
    themeHeaderColor: "",
    themeBgColor: "",
    themeButtonColor: "",
    backgroundGradient: "",
    festivalTag: "",
    displayMode: "inline",
    showAfterSeconds: 0,
    autoExpandFullscreen: false,
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
    sectionType: String(m.sectionType || "product_slider"),
    displayOrder: b.sortOrder ?? 0,
    desktopImageUrl: String(m.desktopImageUrl || b.imageUrl || ""),
    mobileImageUrl: String(m.mobileImageUrl || ""),
    videoUrl: String(m.videoUrl || ""),
    thumbnailUrl: String(m.thumbnailUrl || m.desktopImageUrl || b.imageUrl || ""),
    durationSec: Number(m.durationSec || 0),
    ctaText: String(m.ctaText || ""),
    ctaLink: String(m.ctaLink || b.redirectUrl || ""),
    redirectType: m.redirectType === "internal" ? "internal" : "external",
    redirectId: String(m.redirectId || ""),
    linkType: String(m.linkType || "none"),
    linkTarget: String(m.linkTarget || ""),
    targetLocation: String(m.targetLocation || ""),
    targetSegment: String(m.targetSegment || "all_users"),
    themeHeaderColor: String(m.themeHeaderColor || ""),
    themeBgColor: String(m.themeBgColor || ""),
    themeButtonColor: String(m.themeButtonColor || ""),
    backgroundGradient: String(m.backgroundGradient || ""),
    festivalTag: String(m.festivalTag || ""),
    displayMode: String(m.displayMode || "inline"),
    showAfterSeconds: Number(m.showAfterSeconds || 0),
    autoExpandFullscreen: Boolean(m.autoExpandFullscreen),
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
    sectionType: form.sectionType || null,
    desktopImageUrl: form.desktopImageUrl.trim() || null,
    mobileImageUrl: form.mobileImageUrl.trim() || null,
    videoUrl: form.videoUrl.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    durationSec: Number(form.durationSec || 0),
    ctaText: form.ctaText.trim() || null,
    ctaLink: form.ctaLink.trim() || null,
    redirectType: form.redirectType,
    redirectId: form.redirectId.trim() || null,
    linkType: form.linkType || "none",
    linkTarget: form.linkTarget || null,
    targetLocation: form.targetLocation.trim() || null,
    targetSegment: form.targetSegment || "all_users",
    themeHeaderColor: form.themeHeaderColor.trim() || null,
    themeBgColor: form.themeBgColor.trim() || null,
    themeButtonColor: form.themeButtonColor.trim() || null,
    backgroundGradient: form.backgroundGradient.trim() || null,
    festivalTag: form.festivalTag.trim() || null,
    displayMode: form.displayMode || "inline",
    showAfterSeconds: Number(form.showAfterSeconds || 0),
    autoExpandFullscreen: Boolean(form.autoExpandFullscreen),
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
  const [pendingVideo, setPendingVideo] = useState(null);
  const [pendingThumb, setPendingThumb] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
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

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listCategoriesForProducts({ purpose: "all" }),
      listCatalogServices({ limit: 500, offset: 0 }),
    ])
      .then(([catRes, svcRes]) => {
        if (cancelled) return;
        setCategories(Array.isArray(catRes?.items) ? catRes.items.filter((c) => !c.parentId) : []);
        setServices(Array.isArray(svcRes?.items) ? svcRes.items : []);
      })
      .catch(() => {
        if (cancelled) return;
        setCategories([]);
        setServices([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    setPendingVideo(null);
    setPendingThumb(null);
    setModal({ mode: "add" });
  };

  const openEdit = (row) => {
    setForm(bannerToForm(row));
    setPendingDesktop(null);
    setPendingMobile(null);
    setPendingVideo(null);
    setPendingThumb(null);
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
    const isHero = tab === "hero";
    const isVideo = tab === "video";
    let desktopUrl = form.desktopImageUrl.trim();
    let mobileUrl = form.mobileImageUrl.trim();
    let videoUrl = form.videoUrl.trim();
    let thumbnailUrl = form.thumbnailUrl.trim();

    if (pendingDesktop) {
      try {
        const up = await uploadFile(pendingDesktop);
        desktopUrl = up.url || desktopUrl;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : String(err));
        return;
      }
    }
    if (pendingMobile) {
      try {
        const up = await uploadFile(pendingMobile);
        mobileUrl = up.url || mobileUrl;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : String(err));
        return;
      }
    }
    if (pendingVideo) {
      try {
        const up = await uploadFile(pendingVideo);
        videoUrl = up.url || videoUrl;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : String(err));
        return;
      }
    }
    if (pendingThumb) {
      try {
        const up = await uploadFile(pendingThumb);
        thumbnailUrl = up.url || thumbnailUrl;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : String(err));
        return;
      }
    }

    if (isVideo) {
      if (!videoUrl) {
        toast.error("Video URL is required (or upload a video).");
        return;
      }
      if (!thumbnailUrl) {
        toast.error("Thumbnail is required for video ad.");
        return;
      }
      desktopUrl = thumbnailUrl;
    } else if (!desktopUrl) {
      toast.error("Desktop image is required (URL or upload).");
      return;
    }

    const existingMeta = modal?.row?.metadata || {};
    const cmsSlot =
      modal?.mode === "edit" && modal?.row?.metadata && typeof modal.row.metadata.cmsSlot === "string"
        ? modal.row.metadata.cmsSlot
        : tab;
    const metadata = buildMetadata(
      {
        ...form,
        mediaType: isVideo ? "video" : form.mediaType,
        desktopImageUrl: desktopUrl,
        mobileImageUrl: mobileUrl,
        videoUrl,
        thumbnailUrl,
      },
      cmsSlot,
      existingMeta,
    );

    setSubmitting(true);
    try {
      const body = {
        title,
        imageUrl: isVideo ? thumbnailUrl : desktopUrl,
        redirectUrl:
          form.redirectType === "external"
            ? form.ctaLink.trim() || null
            : form.linkTarget || form.redirectId.trim() || null,
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
  const currentTabTitle = tab === "hero" ? "Hero Carousel Banners" : tab === "content" ? "Content Sections" : "Video Ads";

  return (
    <div className='p4u-home-cms-page'>
      <header className='p4u-home-cms-hero'>
        <h1>Homepage CMS</h1>
        <p>Manage dynamic homepage banners, sections, and video ads</p>
      </header>

      <div className='p4u-home-cms-tabs' role='tablist' aria-label='Homepage CMS sections'>
        {TABS.map((t) => (
          <button key={t.key} type='button' role='tab' aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={tab === t.key ? 'is-active' : ''}>
            <Icon icon={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <section className='p4u-home-cms-section'>
        <div className='p4u-home-cms-section__head'>
          <h2>{currentTabTitle} ({tabItems.length})</h2>
          <button type='button' onClick={openAdd} className='p4u-home-cms-add-btn'>
            <Icon icon='ic:baseline-plus' />
            <span>{addLabel}</span>
          </button>
        </div>

        {error && <div className='alert alert-danger radius-12 mb-16' role='alert'>{error}</div>}

        {loading ? (
          <div className='p4u-home-cms-empty'>Loading...</div>
        ) : tabItems.length === 0 ? (
          <div className='p4u-home-cms-empty'>No items in this tab yet.</div>
        ) : (
          <ul className='p4u-home-cms-list'>
            {tabItems.map((row, idx) => {
              const m = row.metadata || {};
              const img = m.desktopImageUrl || m.thumbnailUrl || row.imageUrl;
              const dateLabel = m.startDate || m.endDate ? `${m.startDate ? String(m.startDate).slice(0, 10) : "-"} - ${m.endDate ? String(m.endDate).slice(0, 10) : "-"}` : "";
              const media = (m.mediaType || (tab === "video" ? "video" : "image")).toUpperCase();
              const isActive = row.isActive !== false;
              return (
                <li key={row.id} className='p4u-home-cms-item'>
                  <div className='p4u-home-cms-order'>
                    <button type='button' disabled={idx === 0} onClick={() => move(idx, -1)} title='Move up'><Icon icon='mdi:chevron-up' /></button>
                    <button type='button' disabled={idx === tabItems.length - 1} onClick={() => move(idx, 1)} title='Move down'><Icon icon='mdi:chevron-down' /></button>
                  </div>
                  <div className='p4u-home-cms-thumb'>
                    {img ? <img src={resolveMediaUrl(img) || img} alt='' onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <Icon icon='mdi:image-outline' />}
                  </div>
                  <div className='p4u-home-cms-info'>
                    <h3>{row.title}</h3>
                    <p>{tab === 'video' && m.durationSec ? `${m.durationSec}s` : media}{tab === 'content' && m.sectionType ? ` - ${String(m.sectionType).replaceAll('_', ' ')}` : ''}{' - '}Order: {row.sortOrder ?? 0}</p>
                    {dateLabel && <span className='p4u-home-cms-date'><Icon icon='mdi:calendar-blank-outline' /> {dateLabel}</span>}
                    <small>{m.impressions ?? 0} impressions - {m.clicks ?? 0} clicks</small>
                  </div>
                  <div className='p4u-home-cms-actions'>
                    <label className='p4u-home-cms-switch'>
                      <input type='checkbox' checked={isActive} onChange={(e) => patchActive(row, e.target.checked)} />
                      <span />
                    </label>
                    <em>{isActive ? 'active' : 'Off'}</em>
                    <button type='button' onClick={() => openEdit(row)} aria-label='Edit'><Icon icon='mdi:pencil-outline' /></button>
                    <button type='button' className='is-danger' onClick={() => handleDelete(row.id)} aria-label='Delete'><Icon icon='mdi:trash-can-outline' /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {modal && (
        <FormModal onClose={() => !submitting && setModal(null)} size='lg'>
          <form onSubmit={handleSubmit} className='p4u-home-cms-modal'>
            <div className='p4u-home-cms-modal__title'><h3>{modal.mode === "edit" ? "Edit item" : addLabel}</h3></div>
            <div className='p4u-home-cms-form-grid'>
              <label className='p4u-home-cms-field span-2'><span>Title *</span><input name='title' value={form.title} onChange={handleChange} required autoFocus /></label>
              {tab !== 'video' && <label className='p4u-home-cms-field span-2'><span>Subtitle</span><input name='subtitle' value={form.subtitle} onChange={handleChange} /></label>}
              {tab === 'hero' && <label className='p4u-home-cms-field'><span>Media Type</span><select name='mediaType' value={form.mediaType} onChange={handleChange}><option value='image'>Image</option><option value='video'>Video</option></select></label>}
              {tab === 'content' && <label className='p4u-home-cms-field'><span>Section Type</span><select name='sectionType' value={form.sectionType} onChange={handleChange}><option value='product_slider'>Product Slider</option><option value='service_grid'>Service Grid</option><option value='promo_strip'>Promo Strip</option><option value='custom_block'>Custom Block</option></select></label>}
              <label className='p4u-home-cms-field'><span>Display Order</span><input type='number' name='displayOrder' value={form.displayOrder} onChange={handleChange} min={0} /></label>

              {tab !== 'video' && <>
                <div className='p4u-home-cms-upload span-2'><span>Desktop Image *</span><label><input type='file' accept={IMAGE_ACCEPT} onChange={(e) => setPendingDesktop(e.target.files?.[0] || null)} /><Icon icon='mdi:image-outline' /><strong>{pendingDesktop ? pendingDesktop.name : 'Choose desktop banner'}</strong><small>Click to open Media Library</small></label><input name='desktopImageUrl' value={form.desktopImageUrl} onChange={handleChange} placeholder='Image URL' /></div>
                <div className='p4u-home-cms-upload span-2'><span>Mobile Image (optional)</span><label><input type='file' accept={IMAGE_ACCEPT} onChange={(e) => setPendingMobile(e.target.files?.[0] || null)} /><Icon icon='mdi:image-outline' /><strong>{pendingMobile ? pendingMobile.name : 'Choose mobile banner'}</strong><small>Click to open Media Library</small></label><input name='mobileImageUrl' value={form.mobileImageUrl} onChange={handleChange} placeholder='Mobile image URL' /></div>
              </>}

              {tab === 'video' && <>
                <div className='p4u-home-cms-field span-2'><span>Optimized Video *</span><label className='p4u-home-cms-video-upload'><input type='file' accept={IMAGE_OR_VIDEO_ACCEPT} onChange={(e) => setPendingVideo(e.target.files?.[0] || null)} /><Icon icon='mdi:upload-outline' /><strong>{pendingVideo ? pendingVideo.name : 'Upload & optimize video'}</strong></label><small>Pick any video file - it will be re-encoded and served correctly.</small></div>
                <label className='p4u-home-cms-field span-2'><span>Video URL (auto-filled)</span><input name='videoUrl' value={form.videoUrl} onChange={handleChange} placeholder='Paste a URL or upload above' /></label>
                <div className='p4u-home-cms-upload span-2'><span>Thumbnail (auto-filled, or pick from Media Library)</span><label><input type='file' accept={IMAGE_ACCEPT} onChange={(e) => setPendingThumb(e.target.files?.[0] || null)} /><Icon icon='mdi:image-outline' /><strong>{pendingThumb ? pendingThumb.name : 'Choose thumbnail'}</strong><small>Click to open Media Library</small></label><input name='thumbnailUrl' value={form.thumbnailUrl} onChange={handleChange} placeholder='Thumbnail URL' /></div>
                <label className='p4u-home-cms-field'><span>Duration (seconds)</span><input type='number' min={0} name='durationSec' value={form.durationSec} onChange={handleChange} /></label>
              </>}

              <label className='p4u-home-cms-field'><span>CTA Text</span><input name='ctaText' value={form.ctaText} onChange={handleChange} /></label>
              <label className='p4u-home-cms-field'><span>CTA Link</span><input name='ctaLink' value={form.ctaLink} onChange={handleChange} /></label>
              <label className='p4u-home-cms-field'><span>Redirect Type</span><select name='redirectType' value={form.redirectType} onChange={handleChange}><option value='external'>External URL</option><option value='internal'>Internal (ID)</option></select></label>
              <label className='p4u-home-cms-field'><span>Redirect ID</span><input name='redirectId' value={form.redirectId} onChange={handleChange} placeholder='Product/Category/Service ID' /></label>
              <label className='p4u-home-cms-field'><span>Theme Header Color</span><input name='themeHeaderColor' value={form.themeHeaderColor} onChange={handleChange} placeholder='#FF5733' /></label>
              <label className='p4u-home-cms-field'><span>Theme BG Color</span><input name='themeBgColor' value={form.themeBgColor} onChange={handleChange} /></label>
              <label className='p4u-home-cms-field'><span>Theme Button Color</span><input name='themeButtonColor' value={form.themeButtonColor} onChange={handleChange} /></label>
              <label className='p4u-home-cms-field'><span>Background Gradient</span><input name='backgroundGradient' value={form.backgroundGradient} onChange={handleChange} placeholder='linear-gradient(135deg, #667eea, #764ba2)' /></label>

              {(tab === 'content' || tab === 'video') && <div className='p4u-home-cms-cta span-2'><h4>CTA DESTINATION</h4><p>Where the Click here button takes the customer.</p><div className='p4u-home-cms-form-grid'><label className='p4u-home-cms-field'><span>Link Type</span><select name='linkType' value={form.linkType} onChange={handleChange}><option value='none'>No link</option><option value='external_url'>External URL</option><option value='product_category'>Product Category</option><option value='service'>Service</option></select></label><label className='p4u-home-cms-field'><span>Target</span>{form.linkType === 'product_category' ? <select name='linkTarget' value={form.linkTarget} onChange={handleChange}><option value=''>Pick a category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select> : form.linkType === 'service' ? <select name='linkTarget' value={form.linkTarget} onChange={handleChange}><option value=''>Pick a service</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select> : <input name='linkTarget' value={form.linkTarget} onChange={handleChange} placeholder={form.linkType === 'external_url' ? 'https://...' : 'Pick a link type first'} disabled={form.linkType === 'none'} />}</label></div></div>}

              {tab === 'content' && <><label className='p4u-home-cms-field'><span>Target Location</span><input name='targetLocation' value={form.targetLocation} onChange={handleChange} placeholder="City name or 'all'" /></label><label className='p4u-home-cms-field'><span>Target Segment</span><select name='targetSegment' value={form.targetSegment} onChange={handleChange}><option value='all_users'>All Users</option><option value='new_users'>New Users</option><option value='returning_users'>Returning Users</option><option value='premium_users'>Premium Users</option></select></label></>}
              {tab === 'video' && <><label className='p4u-home-cms-field'><span>Display Mode</span><select name='displayMode' value={form.displayMode} onChange={handleChange}><option value='floating_pip'>Floating (small PiP)</option><option value='inline'>Inline</option><option value='fullscreen'>Fullscreen</option></select></label><label className='p4u-home-cms-field'><span>Show after (seconds)</span><input type='number' min={0} name='showAfterSeconds' value={form.showAfterSeconds} onChange={handleChange} /></label><label className='p4u-home-cms-check span-2'><input type='checkbox' name='autoExpandFullscreen' checked={form.autoExpandFullscreen} onChange={handleChange} /><span>Auto-expand to fullscreen after 5 seconds</span><small>User can still close. Leave off for non-intrusive ads.</small></label></>}

              <label className='p4u-home-cms-field'><span>Start Date</span><input type='datetime-local' name='startDate' value={form.startDate} onChange={handleChange} /></label>
              <label className='p4u-home-cms-field'><span>End Date</span><input type='datetime-local' name='endDate' value={form.endDate} onChange={handleChange} /></label>
              <label className='p4u-home-cms-field'><span>Festival Tag</span><input name='festivalTag' value={form.festivalTag} onChange={handleChange} placeholder='e.g. Diwali, Christmas' /></label>
              <label className='p4u-home-cms-active'><input type='checkbox' name='isActive' checked={form.isActive} onChange={handleChange} /><span /><strong>{tab === 'content' ? 'Visible' : 'Active'}</strong></label>
            </div>
            <div className='p4u-home-cms-modal__footer'><button type='button' onClick={() => setModal(null)} disabled={submitting}>Cancel</button><button type='submit' disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button></div>
          </form>
        </FormModal>
      )}
    </div>
  );
};

export default HomepageCmsLayer;
