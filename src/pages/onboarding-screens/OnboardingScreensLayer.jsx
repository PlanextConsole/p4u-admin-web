import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { createBanner, deleteBanner, listBanners, updateBanner, uploadFile } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import FormModal from "../../components/admin/FormModal";

function emptyForm(nextOrder = 1) {
  return {
    title: "",
    description: "",
    imageUrl: "",
    displayOrder: nextOrder,
    isActive: false,
  };
}

function slideToForm(slide) {
  const meta = slide.metadata || {};
  return {
    title: slide.title || "",
    description: String(meta.description || ""),
    imageUrl: String(meta.imageUrl || slide.imageUrl || ""),
    displayOrder: slide.sortOrder ?? 1,
    isActive: slide.isActive === true,
  };
}

const OnboardingScreensLayer = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(() => emptyForm());
  const [pendingImage, setPendingImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBanners();
      const rows = Array.isArray(res.items) ? res.items : [];
      setSlides(
        rows
          .filter((row) => row.metadata?.onboardingCMS === true)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      );
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const activeCount = useMemo(() => slides.filter((slide) => slide.isActive === true).length, [slides]);
  const nextOrder = useMemo(() => Math.max(0, ...slides.map((slide) => Number(slide.sortOrder || 0))) + 1, [slides]);

  const openAdd = () => {
    setForm(emptyForm(nextOrder));
    setPendingImage(null);
    setModal({ mode: "add" });
  };

  const openEdit = (slide) => {
    setForm(slideToForm(slide));
    setPendingImage(null);
    setModal({ mode: "edit", id: slide.id, row: slide });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "displayOrder" ? Number(value || 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error("Title is required.");
      return;
    }

    let imageUrl = form.imageUrl.trim();
    if (pendingImage) {
      try {
        const up = await uploadFile(pendingImage);
        imageUrl = up.url || imageUrl;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : String(err));
        return;
      }
    }

    setSubmitting(true);
    try {
      const body = {
        title,
        imageUrl: imageUrl || null,
        redirectUrl: null,
        sortOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
        metadata: {
          ...(modal?.row?.metadata || {}),
          onboardingCMS: true,
          description: form.description.trim() || null,
          imageUrl: imageUrl || null,
        },
      };

      if (modal?.mode === "edit" && modal.id) {
        await updateBanner(modal.id, body);
        toast.success("Slide updated.");
      } else {
        await createBanner(body);
        toast.success("Slide added.");
      }
      setModal(null);
      await loadSlides();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slide) => {
    if (!window.confirm("Delete this onboarding slide?")) return;
    try {
      await deleteBanner(slide.id);
      toast.success("Slide deleted.");
      await loadSlides();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const patchActive = async (slide, next) => {
    try {
      await updateBanner(slide.id, { isActive: next });
      await loadSlides();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const preview = () => {
    toast.info("Preview uses the same active onboarding slides shown below.");
  };

  return (
    <div className='p4u-onboarding-page'>
      <header className='p4u-onboarding-hero'>
        <h1>Onboarding Screens</h1>
        <p>Manage first-time user experience slides - {slides.length} slides ({activeCount} active)</p>
      </header>

      <div className='p4u-onboarding-toolbar'>
        <button type='button' className='p4u-onboarding-preview' onClick={preview}>
          <Icon icon='mdi:eye-outline' />
          <span>Preview</span>
        </button>
        <button type='button' className='p4u-onboarding-add' onClick={openAdd}>
          <Icon icon='ic:baseline-plus' />
          <span>Add Slide</span>
        </button>
      </div>

      {loading ? (
        <div className='p4u-onboarding-empty'>Loading...</div>
      ) : slides.length === 0 ? (
        <div className='p4u-onboarding-empty'>No onboarding slides yet.</div>
      ) : (
        <div className='p4u-onboarding-grid'>
          {slides.map((slide, index) => {
            const meta = slide.metadata || {};
            const imageUrl = meta.imageUrl || slide.imageUrl;
            const isActive = slide.isActive === true;
            return (
              <article key={slide.id} className={`p4u-onboarding-card ${!isActive ? 'is-muted' : ''}`}>
                <div className='p4u-onboarding-card-head'>
                  <Icon icon='mdi:drag-vertical' />
                  <span>#{slide.sortOrder || index + 1}</span>
                  <label className='p4u-onboarding-switch'>
                    <input type='checkbox' checked={isActive} onChange={(e) => patchActive(slide, e.target.checked)} />
                    <i />
                  </label>
                </div>
                <div className='p4u-onboarding-image'>
                  {imageUrl ? <img src={resolveMediaUrl(imageUrl) || imageUrl} alt={slide.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <Icon icon='mdi:image-outline' />}
                </div>
                <h2>{slide.title}</h2>
                <p>{meta.description || "No description added."}</p>
                <div className='p4u-onboarding-actions'>
                  <button type='button' onClick={() => openEdit(slide)}><Icon icon='mdi:pencil-outline' /> Edit</button>
                  <button type='button' className='is-danger' onClick={() => handleDelete(slide)}><Icon icon='mdi:trash-can-outline' /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modal && (
        <FormModal onClose={() => !submitting && setModal(null)} size='md'>
          <form onSubmit={handleSubmit} className='p4u-onboarding-modal'>
            <h3>{modal.mode === "edit" ? "Edit Slide" : "Add Slide"}</h3>

            <label className='p4u-onboarding-field'>
              <span>Title</span>
              <input name='title' value={form.title} onChange={handleChange} autoFocus />
            </label>

            <label className='p4u-onboarding-field'>
              <span>Description</span>
              <div className='p4u-onboarding-editor-toolbar'>
                <button type='button'>B</button>
                <button type='button'><Icon icon='mdi:format-italic' /></button>
                <button type='button'><Icon icon='mdi:format-underline' /></button>
                <button type='button'><Icon icon='mdi:format-list-bulleted' /></button>
                <button type='button'><Icon icon='mdi:format-list-numbered' /></button>
                <i />
                <button type='button' className='is-active'><Icon icon='mdi:pencil-outline' /></button>
                <button type='button'><Icon icon='mdi:eye-outline' /></button>
              </div>
              <textarea name='description' value={form.description} onChange={handleChange} placeholder='Onboarding screen description...' rows={4} />
            </label>

            <div className='p4u-onboarding-upload'>
              <span>Image</span>
              <label>
                <input type='file' accept={IMAGE_ACCEPT} onChange={(e) => setPendingImage(e.target.files?.[0] || null)} />
                <Icon icon='mdi:image-outline' />
                <strong>{pendingImage ? pendingImage.name : 'Select Onboarding Image'}</strong>
                <small>Click to open Media Library</small>
              </label>
              <input name='imageUrl' value={form.imageUrl} onChange={handleChange} placeholder='Image URL' />
            </div>

            <div className='p4u-onboarding-modal-bottom'>
              <label className='p4u-onboarding-field'>
                <span>Display Order</span>
                <input type='number' min={0} name='displayOrder' value={form.displayOrder} onChange={handleChange} />
              </label>
              <label className='p4u-onboarding-active'>
                <input type='checkbox' name='isActive' checked={form.isActive} onChange={handleChange} />
                <i />
                <span>Active</span>
              </label>
            </div>

            <div className='p4u-onboarding-modal-footer'>
              <button type='button' onClick={() => setModal(null)} disabled={submitting}>Cancel</button>
              <button type='submit' disabled={submitting}>{submitting ? 'Saving...' : modal.mode === 'edit' ? 'Save' : 'Add'}</button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
};

export default OnboardingScreensLayer;
