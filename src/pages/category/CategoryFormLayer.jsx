import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createProductCategory,
  createProductSubcategory,
  createServiceCategory,
  createServiceSubcategory,
  getProductCategory,
  getProductSubcategory,
  getServiceCategory,
  getServiceSubcategory,
  updateProductCategory,
  updateProductSubcategory,
  updateServiceCategory,
  updateServiceSubcategory,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";
import { formatUploadError, validateImageFile } from "../../lib/uploadHelpers";
import ImageUploadField from "../../components/admin/ImageUploadField";

const YES_NO = ["Yes", "No"];

const emptyServiceRoot = () => ({
  parentId: "",
  name: "",
  availability: "No",
  trending: "No",
  description: "",
  iconUrl: "",
});

const emptyProductVisual = () => ({
  parentId: "",
  name: "",
  availability: "No",
  trending: "No",
  description: "",
  thumbnailUrl: "",
  bannerUrls: [],
  commissionOverridePercent: "",
});

/**
 * @param {{ variant?: 'service-roots' | 'service-subs' | 'product-roots' | 'product-subs', isEdit?: boolean, isView?: boolean, categoryId?: string, scope?: 'root'|'subcategory', rootCategories?: { id: string, name: string }[], onSuccess?: () => void, onCancel?: () => void, onDelete?: () => void }} props
 */
const CategoryFormLayer = ({
  variant = "service-roots",
  isEdit = false,
  isView = false,
  categoryId,
  scope = "root",
  rootCategories = [],
  onSuccess,
  onCancel,
  onDelete,
}) => {
  const navigate = useNavigate();
  const isRoot = scope === "root";
  const isServiceRoot = variant === "service-roots" && isRoot;
  const isProductRoot = variant === "product-roots" && isRoot;
  const isServiceSub = variant === "service-subs";
  const isProductSub = variant === "product-subs" || (variant === "product-roots" && !isRoot);
  const isAnySub = isProductSub || isServiceSub;
  const inModal = Boolean(onCancel);

  const initialEmpty = () => {
    if (isServiceRoot) return emptyServiceRoot();
    return emptyProductVisual();
  };

  const [formData, setFormData] = useState(initialEmpty);
  const [entityLoading, setEntityLoading] = useState(Boolean(categoryId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingIcon, setPendingIcon] = useState(null);
  const [pendingThumbnail, setPendingThumbnail] = useState(null);
  const [pendingBanners, setPendingBanners] = useState([]);

  const applyRow = useCallback(
    (row) => {
      if (isServiceRoot) {
        setFormData({
          parentId: "",
          name: row.name || "",
          availability: row.availability ? "Yes" : "No",
          trending: row.trending ? "Yes" : "No",
          description: row.description || "",
          iconUrl: row.iconUrl || "",
        });
      } else if (isProductRoot) {
        setFormData({
          parentId: "",
          name: row.name || "",
          availability: row.availability ? "Yes" : "No",
          trending: row.trending ? "Yes" : "No",
          description: row.description || "",
          thumbnailUrl: row.thumbnailUrl || "",
          bannerUrls: Array.isArray(row.bannerUrls) ? row.bannerUrls : [],
          commissionOverridePercent: row.commissionOverridePercent != null ? String(row.commissionOverridePercent) : "",
        });
      } else {
        setFormData({
          parentId: row.productCategoryId || row.serviceCategoryId || row.parentId || "",
          name: row.name || "",
          availability: row.availability ? "Yes" : "No",
          trending: row.trending ? "Yes" : "No",
          description: row.description || "",
          thumbnailUrl: row.thumbnailUrl || "",
          bannerUrls: Array.isArray(row.bannerUrls) ? row.bannerUrls : [],
          commissionOverridePercent: row.commissionOverridePercent != null ? String(row.commissionOverridePercent) : "",
        });
      }
    },
    [isServiceRoot, isProductRoot],
  );

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
        let row;
        if (isServiceRoot) row = await getServiceCategory(categoryId);
        else if (isProductRoot) row = await getProductCategory(categoryId);
        else if (isServiceSub) row = await getServiceSubcategory(categoryId);
        else row = await getProductSubcategory(categoryId);
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
    return () => {
      cancelled = true;
    };
  }, [categoryId, applyRow, isServiceRoot, isProductRoot, isServiceSub]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;

    if (!isRoot && !formData.parentId?.trim()) {
      toast.error("Select a parent category.");
      return;
    }

    if (!formData.name?.trim()) {
      toast.error("Enter a name.");
      return;
    }

    let iconUrl = isServiceRoot ? formData.iconUrl : undefined;
    let thumbnailUrl = !isServiceRoot ? formData.thumbnailUrl : undefined;
    let bannerUrls = !isServiceRoot ? [...formData.bannerUrls] : undefined;

    if (isServiceRoot && pendingIcon) {
      const iconErr = validateImageFile(pendingIcon);
      if (iconErr) {
        toast.error(iconErr);
        return;
      }
      try {
        const res = await uploadFile(pendingIcon);
        iconUrl = res.url;
      } catch (err) {
        toast.error(formatUploadError(err, "Icon upload failed"));
        return;
      }
    }
    if (!isServiceRoot && pendingThumbnail) {
      const thumbErr = validateImageFile(pendingThumbnail);
      if (thumbErr) {
        toast.error(thumbErr);
        return;
      }
      try {
        const res = await uploadFile(pendingThumbnail);
        thumbnailUrl = res.url;
      } catch (err) {
        toast.error(formatUploadError(err, "Thumbnail upload failed"));
        return;
      }
    }
    if (!isServiceRoot) {
      for (const file of pendingBanners) {
        const bannerErr = validateImageFile(file);
        if (bannerErr) {
          toast.error(bannerErr);
          return;
        }
        try {
          const res = await uploadFile(file);
          bannerUrls.push(res.url);
        } catch (err) {
          toast.error(formatUploadError(err, "Banner upload failed"));
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const parentId = !isRoot ? formData.parentId?.trim() || null : null;

      if (isServiceRoot) {
        const payload = {
          name: formData.name.trim() || null,
          parentId: null,
          availability: formData.availability === "Yes",
          emergency: false,
          trending: formData.trending === "Yes",
          description: formData.description.trim() || null,
          iconUrl: iconUrl || null,
          thumbnailUrl: null,
          bannerUrls: null,
        };
        if (isEdit && categoryId) {
          await updateServiceCategory(categoryId, payload);
          toast.success("Service category updated.");
        } else {
          await createServiceCategory(payload);
          toast.success("Service category created.");
        }
      } else if (isProductRoot) {
        const payload = {
          name: formData.name.trim() || null,
          availability: formData.availability === "Yes",
          emergency: false,
          trending: formData.trending === "Yes",
          description: formData.description.trim() || null,
          thumbnailUrl: thumbnailUrl || null,
          bannerUrls: bannerUrls.length > 0 ? bannerUrls : null,
          commissionOverridePercent:
            formData.commissionOverridePercent !== "" ? Number(formData.commissionOverridePercent) : null,
        };
        if (isEdit && categoryId) {
          await updateProductCategory(categoryId, payload);
          toast.success("Product category updated.");
        } else {
          await createProductCategory(payload);
          toast.success("Product category created.");
        }
      } else if (isServiceSub) {
        const payload = {
          name: formData.name.trim() || null,
          parentId,
          availability: formData.availability === "Yes",
          emergency: false,
          trending: formData.trending === "Yes",
          description: formData.description.trim() || null,
          thumbnailUrl: thumbnailUrl || null,
          bannerUrls: bannerUrls.length > 0 ? bannerUrls : null,
        };
        if (isEdit && categoryId) {
          await updateServiceSubcategory(categoryId, payload);
          toast.success("Service subcategory updated.");
        } else {
          await createServiceSubcategory(payload);
          toast.success("Service subcategory created.");
        }
      } else {
        const payload = {
          name: formData.name.trim() || null,
          parentId,
          availability: formData.availability === "Yes",
          emergency: false,
          trending: formData.trending === "Yes",
          description: formData.description.trim() || null,
          thumbnailUrl: thumbnailUrl || null,
          bannerUrls: bannerUrls.length > 0 ? bannerUrls : null,
          commissionOverridePercent:
            formData.commissionOverridePercent !== "" ? Number(formData.commissionOverridePercent) : null,
        };
        if (isEdit && categoryId) {
          await updateProductSubcategory(categoryId, payload);
          toast.success("Subcategory updated.");
        } else {
          await createProductSubcategory(payload);
          toast.success("Subcategory created.");
        }
      }

      if (onSuccess) onSuccess();
      else {
        if (variant === "service-roots") navigate("/service-categories");
        else if (variant === "service-subs") navigate("/service-subcategories");
        else if (variant === "product-roots") navigate("/product-categories");
        else navigate("/subcategories");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialEmpty());
    setPendingIcon(null);
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

  const titleLine = () => {
    const name = formData.name?.trim();
    if (isEdit && name) return `Edit: ${name}`;
    if (isAnySub) return isView ? "View subcategory" : isEdit ? "Edit subcategory" : "Add Subcategory";
    if (isServiceRoot) return isView ? "View service category" : isEdit ? "Edit service category" : "Add Category";
    if (isProductRoot) return isView ? "View product category" : isEdit ? "Edit product category" : "Add Category";
    return isView ? "View category" : isEdit ? "Edit category" : "Add Category";
  };

  const typeLabel = isServiceRoot || isServiceSub ? "SERVICE" : "PRODUCT";

  const cancelAction = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  const content = (
  <div className={inModal ? "p4u-category-modal" : "card h-100 p-0 radius-12"}>
    {!inModal && (
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h4 className="text-lg fw-semibold mb-0">{titleLine()}</h4>
      </div>
    )}
    <div className={inModal ? "" : "card-body p-24"}>
      {inModal && <h4 className="p4u-category-modal__title">{titleLine()}</h4>}
      {loadError && categoryId && !showSkeleton && (
        <div className="alert alert-danger radius-12 mb-16" role="alert">{loadError}</div>
      )}
      {showSkeleton ? (
        <p className="text-secondary-light mb-0">Loading category...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="p4u-category-form-grid">
            {isAnySub && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Parent category <span className="text-danger">*</span></label>
                <select
                  className="form-control form-select"
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                  disabled={disabled}
                >
                  <option value="">Select parent...</option>
                  {rootCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || c.id}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">{isAnySub ? "Subcategory Name" : "Category Name"} <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={disabled}
                maxLength={255}
                placeholder={isServiceRoot ? "e.g. Home Services, Repair, Beauty" : ""}
              />
            </div>
            <div>
              <label className="form-label">Category Type</label>
              <select className="form-control form-select" disabled value={typeLabel}>
                <option value={typeLabel}>{typeLabel}</option>
              </select>
            </div>
          </div>

          <div className="p4u-category-form-box">
            <h6>Status &amp; visibility</h6>
            <div className="p4u-category-form-grid">
              <div>
                <label className="form-label">Availability</label>
                <select className="form-control form-select" name="availability" value={formData.availability} onChange={handleChange} disabled={disabled}>
                  {YES_NO.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Trending</label>
                <select className="form-control form-select" name="trending" value={formData.trending} onChange={handleChange} disabled={disabled}>
                  {YES_NO.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {(isProductRoot || isProductSub) && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Commission Override % (this category)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-control"
                    name="commissionOverridePercent"
                    value={formData.commissionOverridePercent}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Leave blank to use vendor/plan"
                  />
                </div>
              )}
            </div>
          </div>

          {isServiceRoot ? (
            <div className="p4u-category-form-box">
              <h6>Media</h6>
              <div>
                <label className="form-label">Icon (from Media Library)</label>
                <ImageUploadField
                  disabled={disabled}
                  onFileSelect={(f) => setPendingIcon(f)}
                  onLibrarySelect={(url) => {
                    setPendingIcon(null);
                    setFormData((prev) => ({ ...prev, iconUrl: url }));
                  }}
                  libraryTitle="Choose category icon"
                />
                <div className="p4u-category-media-preview mt-12">
                  {(pendingIcon || formData.iconUrl) ? (
                    <img
                      src={pendingIcon ? URL.createObjectURL(pendingIcon) : resolveMediaUrl(formData.iconUrl)}
                      alt="Category icon"
                      style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-secondary-light text-sm">No icon selected</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p4u-category-form-box">
              <h6>Media</h6>
              <div className="p4u-category-media-grid">
                <div>
                  <label className="form-label">Image</label>
                  <ImageUploadField
                    disabled={disabled}
                    onFileSelect={(f) => setPendingThumbnail(f)}
                    onLibrarySelect={(url) => {
                      setPendingThumbnail(null);
                      setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
                    }}
                    libraryTitle="Choose category thumbnail"
                  />
                  <div className="p4u-category-media-preview mt-12">
                    {(pendingThumbnail || formData.thumbnailUrl) ? (
                      <img
                        src={pendingThumbnail ? URL.createObjectURL(pendingThumbnail) : resolveMediaUrl(formData.thumbnailUrl)}
                        alt="Thumbnail"
                        style={{ maxWidth: "100%", maxHeight: 140, objectFit: "cover" }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-secondary-light text-sm">No image selected</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="form-label">Banner Image</label>
                  <input
                    type="file"
                    className="form-control"
                    accept={IMAGE_ACCEPT}
                    multiple
                    disabled={disabled}
                    onChange={(e) => {
                      if (e.target.files?.length) setPendingBanners([...e.target.files]);
                    }}
                  />
                  <div className="p4u-category-media-preview mt-12">
                    {formData.bannerUrls.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2 p-2">
                        {formData.bannerUrls.map((url, i) => (
                          <div key={i} className="position-relative">
                            <img
                              src={resolveMediaUrl(url)}
                              alt={`Banner ${i + 1}`}
                              style={{ width: 120, height: 72, objectFit: "cover", borderRadius: 10 }}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                            {!disabled && (
                              <button
                                type="button"
                                className="position-absolute top-0 end-0 border-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: 22, height: 22, fontSize: 12 }}
                                onClick={() => removeBannerUrl(i)}
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-secondary-light text-sm">No banner selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-16">
            <label className="form-label">Description</label>
            <textarea className="form-control" name="description" rows={4} value={formData.description} onChange={handleChange} disabled={disabled} />
          </div>

          {inModal ? (
            <div className="p4u-category-modal__foot">
              {isEdit && onDelete && !isView ? (
                <button type="button" onClick={onDelete} className="is-danger">
                  <Icon icon="mdi:trash-can-outline" /> Delete
                </button>
              ) : <span />}
              <div className="p4u-category-modal__foot-right">
                <button type="button" onClick={cancelAction} className="p4u-categories-btn-outline is-outline">Cancel</button>
                {!isView && (
                  <button type="submit" disabled={disabled} className="p4u-categories-btn-primary is-primary">
                    {submitting ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-between mt-24">
              <button
                type="button"
                onClick={isView ? cancelAction : handleReset}
                className="btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2"
              >
                <Icon icon="mdi:close-circle-outline" className="text-xl" /> {isView ? "Back" : "Reset"}
              </button>
              {!isView && (
                <button type="submit" disabled={disabled} className="btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2">
                  <Icon icon="lucide:save" className="text-xl" /> {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
                </button>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  </div>
  );

  return content;
};

export default CategoryFormLayer;
