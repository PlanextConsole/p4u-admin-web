import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { createBanner, updateBanner, uploadFile } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";

const empty = () => ({
  title: "",
  subtitle: "",
  desktopImageUrl: "",
  mobileImageUrl: "",
  redirectUrl: "/app/browse",
  gradient: "from-primary to-primary/70",
  sortOrder: 1,
  startDate: "",
  endDate: "",
  isActive: true,
});

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const BannerFormLayer = ({ isEdit = false, isView = false, initialData = null, onSuccess, onCancel }) => {
  const [form, setForm] = useState(empty);
  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      const meta = initialData.metadata || {};
      setForm({
        title: initialData.title || "",
        subtitle: meta.subtitle || "",
        desktopImageUrl: meta.desktopImageUrl || initialData.imageUrl || "",
        mobileImageUrl: meta.mobileImageUrl || "",
        redirectUrl: initialData.redirectUrl || "/app/browse",
        gradient: meta.gradient || "from-primary to-primary/70",
        sortOrder: initialData.sortOrder ?? 1,
        startDate: toDateInput(meta.startDate),
        endDate: toDateInput(meta.endDate),
        isActive: initialData.isActive !== false,
      });
    } else {
      setForm(empty());
    }
    setDesktopFile(null);
    setMobileFile(null);
    desktopRef.current = null;
    mobileRef.current = null;
  }, [initialData]);

  const disabled = isView || submitting;

  const handleChange = (event) => {
    if (disabled) return;
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "sortOrder" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleStatusChange = (event) => {
    if (disabled) return;
    setForm((prev) => ({ ...prev, isActive: event.target.value === "active" }));
  };

  const pickDesktop = (event) => {
    if (disabled) return;
    const file = event.target.files && event.target.files[0];
    if (file) {
      desktopRef.current = file;
      setDesktopFile(file);
    }
  };

  const pickMobile = (event) => {
    if (disabled) return;
    const file = event.target.files && event.target.files[0];
    if (file) {
      mobileRef.current = file;
      setMobileFile(file);
    }
  };

  const uploadIfNeeded = async (file, fallback) => {
    if (!file) return fallback;
    const result = await uploadFile(file);
    return result.url;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isView) return;

    const title = form.title.trim();
    if (!title) {
      toast.error("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const desktopImageUrl = await uploadIfNeeded(desktopRef.current || desktopFile, form.desktopImageUrl);
      const mobileImageUrl = await uploadIfNeeded(mobileRef.current || mobileFile, form.mobileImageUrl);

      if (!desktopImageUrl) {
        toast.error("Desktop image is required.");
        setSubmitting(false);
        return;
      }

      const metadata = {
        subtitle: form.subtitle.trim(),
        desktopImageUrl,
        mobileImageUrl,
        gradient: form.gradient.trim(),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      const body = {
        title,
        imageUrl: desktopImageUrl,
        redirectUrl: form.redirectUrl.trim() || "/app/browse",
        sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
        isActive: form.isActive,
        metadata,
      };

      if (isEdit && initialData?.id) {
        await updateBanner(initialData.id, body);
        toast.success("Banner updated.");
      } else {
        await createBanner(body);
        toast.success("Banner created.");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderDropzone = ({ label, name, value, file, onChange }) => (
    <label className='p4u-banner-upload'>
      <input type='file' accept={IMAGE_ACCEPT} onChange={onChange} disabled={disabled} />
      {value ? (
        <img src={resolveMediaUrl(value)} alt={label} onError={(event) => { event.currentTarget.style.display = "none"; }} />
      ) : null}
      <Icon icon='lucide:image' />
      <span>{file ? file.name : label}</span>
      <small>Click to open Media Library</small>
    </label>
  );

  return (
    <form className='p4u-banner-modal' onSubmit={handleSubmit}>
      <h2>{isView ? "View Banner" : isEdit ? "Edit Banner" : "New Banner"}</h2>

      <label className='p4u-banner-field is-full'>
        <span>Title *</span>
        <input name='title' value={form.title} onChange={handleChange} disabled={disabled} required maxLength={255} autoFocus={!isView} />
      </label>

      <label className='p4u-banner-field is-full'>
        <span>Subtitle</span>
        <input name='subtitle' value={form.subtitle} onChange={handleChange} disabled={disabled} />
      </label>

      <div className='p4u-banner-form-grid'>
        <div className='p4u-banner-drop-field'>
          <span>Desktop Image</span>
          {renderDropzone({ label: "Desktop Image", name: "desktopImage", value: form.desktopImageUrl, file: desktopFile, onChange: pickDesktop })}
        </div>
        <div className='p4u-banner-drop-field'>
          <span>Mobile Image</span>
          {renderDropzone({ label: "Mobile Image", name: "mobileImage", value: form.mobileImageUrl, file: mobileFile, onChange: pickMobile })}
        </div>
      </div>

      <label className='p4u-banner-field is-full'>
        <span>Link</span>
        <input name='redirectUrl' value={form.redirectUrl} onChange={handleChange} disabled={disabled} />
      </label>

      <label className='p4u-banner-field is-full'>
        <span>Gradient (fallback if no image)</span>
        <input name='gradient' value={form.gradient} onChange={handleChange} disabled={disabled} />
      </label>

      <div className='p4u-banner-form-grid is-three'>
        <label className='p4u-banner-field'>
          <span>Priority</span>
          <input type='number' min='0' name='sortOrder' value={form.sortOrder} onChange={handleChange} disabled={disabled} />
        </label>
        <label className='p4u-banner-field'>
          <span>Start Date</span>
          <input type='date' name='startDate' value={form.startDate} onChange={handleChange} disabled={disabled} />
        </label>
        <label className='p4u-banner-field'>
          <span>End Date</span>
          <input type='date' name='endDate' value={form.endDate} onChange={handleChange} disabled={disabled} />
        </label>
      </div>

      <label className='p4u-banner-field is-full'>
        <span>Status</span>
        <select value={form.isActive ? "active" : "inactive"} onChange={handleStatusChange} disabled={disabled}>
          <option value='active'>Active</option>
          <option value='inactive'>Inactive</option>
        </select>
      </label>

      <div className='p4u-banner-modal-footer'>
        <button type='button' className='p4u-banner-cancel' onClick={() => (onCancel ? onCancel() : window.history.back())}>
          {isView ? "Back" : "Cancel"}
        </button>
        {!isView && (
          <button type='submit' className='p4u-banner-submit' disabled={disabled}>
            {submitting ? "Saving..." : isEdit ? "Save" : "Create"}
          </button>
        )}
      </div>
    </form>
  );
};

export default BannerFormLayer;
