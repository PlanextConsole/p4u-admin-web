import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCategory,
  getCategory,
  listCatalogServices,
  updateCategory,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import CountAndChips from "../../components/admin/CountAndChips";

const YES_NO = ["Yes", "No"];

const emptyForm = () => ({
  name: "",
  availability: "No",
  emergency: "No",
  trending: "No",
  description: "",
  thumbnailUrl: "",
  bannerUrls: [],
});

/**
 * @param {{ isEdit?: boolean, isView?: boolean, categoryId?: string }} props
 */
const CategoryFormLayer = ({ isEdit = false, isView = false, categoryId }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [entityLoading, setEntityLoading] = useState(Boolean(categoryId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingThumbnail, setPendingThumbnail] = useState(null);
  const [pendingBanners, setPendingBanners] = useState([]);
  const [linkedServices, setLinkedServices] = useState([]);
  const [linkedServicesLoading, setLinkedServicesLoading] = useState(false);

  const applyRow = useCallback((row) => {
    setFormData({
      name: row.name || "",
      availability: row.availability ? "Yes" : "No",
      emergency: row.emergency ? "Yes" : "No",
      trending: row.trending ? "Yes" : "No",
      description: row.description || "",
      thumbnailUrl: row.thumbnailUrl || "",
      bannerUrls: Array.isArray(row.bannerUrls) ? row.bannerUrls : [],
    });
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setEntityLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setEntityLoading(true);
      setLoadError("");
      try {
        const row = await getCategory(categoryId);
        if (!cancelled) applyRow(row);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : String(e);
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setEntityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId, applyRow]);

  useEffect(() => {
    if (!categoryId) {
      setLinkedServices([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLinkedServicesLoading(true);
      try {
        const sRes = await listCatalogServices({ limit: 500, offset: 0 });
        if (cancelled) return;
        const all = sRes.items || [];
        setLinkedServices(all.filter((s) => s.categoryId === categoryId));
      } catch {
        if (!cancelled) setLinkedServices([]);
      } finally {
        if (!cancelled) setLinkedServicesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;

    // Upload files BEFORE setSubmitting
    let thumbnailUrl = formData.thumbnailUrl;
    let bannerUrls = [...formData.bannerUrls];

    if (pendingThumbnail) {
      try {
        const res = await uploadFile(pendingThumbnail);
        thumbnailUrl = res.url;
      } catch (err) {
        toast.error("Thumbnail upload failed");
        return;
      }
    }
    for (const file of pendingBanners) {
      try {
        const res = await uploadFile(file);
        bannerUrls.push(res.url);
      } catch (err) {
        toast.error("Banner upload failed");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim() || null,
        availability: formData.availability === "Yes",
        emergency: formData.emergency === "Yes",
        trending: formData.trending === "Yes",
        description: formData.description.trim() || null,
        thumbnailUrl: thumbnailUrl || null,
        bannerUrls: bannerUrls.length > 0 ? bannerUrls : null,
      };

      if (isEdit && categoryId) {
        await updateCategory(categoryId, payload);
        toast.success("Category updated.");
      } else {
        await createCategory(payload);
        toast.success("Category created.");
      }
      navigate("/category");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(emptyForm());
    setPendingThumbnail(null);
    setPendingBanners([]);
  };

  const removeBannerUrl = (index) => {
    setFormData((prev) => ({
      ...prev,
      bannerUrls: prev.bannerUrls.filter((_, i) => i !== index),
    }));
  };

  const disabled = isView || submitting || entityLoading;
  const showSkeleton = Boolean(categoryId) && entityLoading;

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h4 className="text-lg fw-semibold mb-0">
          {isView ? "View Category" : isEdit ? "Edit Category" : "Add Category"}
        </h4>
      </div>
      <div className="card-body p-24">
        {loadError && categoryId && !showSkeleton && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">
            {loadError}
          </div>
        )}
        {showSkeleton ? (
          <p className="text-secondary-light mb-0">Loading category...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Name</label>
                <input type="text" className="form-control radius-8" name="name" value={formData.name} onChange={handleChange} disabled={disabled} maxLength={255} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Availability</label>
                <select className="form-control radius-8 form-select" name="availability" value={formData.availability} onChange={handleChange} disabled={disabled}>
                  {YES_NO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Emergency</label>
                <select className="form-control radius-8 form-select" name="emergency" value={formData.emergency} onChange={handleChange} disabled={disabled}>
                  {YES_NO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Trending</label>
                <select className="form-control radius-8 form-select" name="trending" value={formData.trending} onChange={handleChange} disabled={disabled}>
                  {YES_NO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </div>

              <div className="col-md-12 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Description</label>
                <textarea className="form-control radius-8" name="description" rows={5} value={formData.description} onChange={handleChange} disabled={disabled} />
              </div>

              {categoryId && (
                <div className="col-md-12 mb-20">
                  <label className="form-label fw-semibold text-primary-light text-sm mb-8">Sub categories (services)</label>
                  <div className="radius-8 border border-neutral-200 p-16 bg-base">
                    {linkedServicesLoading ? (
                      <span className="text-secondary-light text-sm">Loading services...</span>
                    ) : (
                      <CountAndChips
                        items={linkedServices}
                        getLabel={(s) => s.name}
                        getKey={(s) => s.id}
                        countSuffix="services"
                        emptyLabel="No services linked to this category yet."
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Thumbnail & Banner ── */}
            <div className="row bg-neutral-50 radius-12 p-16 mb-20">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Thumbnail</label>
                <input type="file" className="form-control radius-8" accept="image/*" disabled={disabled}
                  onChange={(e) => { if (e.target.files?.[0]) setPendingThumbnail(e.target.files[0]); }}
                />
                {(pendingThumbnail || formData.thumbnailUrl) && (
                  <div className="mt-8">
                    <img src={pendingThumbnail ? URL.createObjectURL(pendingThumbnail) : formData.thumbnailUrl} alt="Thumbnail" style={{ maxWidth: 120, maxHeight: 120, objectFit: "cover", borderRadius: 8 }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Banner</label>
                <input type="file" className="form-control radius-8" accept="image/*" multiple disabled={disabled}
                  onChange={(e) => { if (e.target.files?.length) setPendingBanners([...e.target.files]); }}
                />
                {formData.bannerUrls.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-8">
                    {formData.bannerUrls.map((url, i) => (
                      <div key={i} className="position-relative">
                        <img src={url} alt={`Banner ${i + 1}`} style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 6 }} onError={(e) => { e.target.style.display = "none"; }} />
                        {!disabled && (
                          <button type="button" className="position-absolute top-0 end-0 border-0 bg-danger-600 text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 18, height: 18, fontSize: 10 }} onClick={() => removeBannerUrl(i)}>&times;</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="d-flex align-items-center justify-content-between mt-24">
              <button type="button" onClick={isView ? () => navigate(-1) : handleReset}
                className="btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2">
                <Icon icon="mdi:close-circle-outline" className="text-xl" /> {isView ? "Back" : "Reset"}
              </button>
              {!isView && (
                <button type="submit" disabled={disabled}
                  className="btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2">
                  <Icon icon="lucide:save" className="text-xl" />{" "}
                  {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CategoryFormLayer;
