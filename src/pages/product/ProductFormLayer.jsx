import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createProduct,
  getProduct,
  listCategories,
  listCatalogServices,
  listTaxConfigurations,
  listVendors,
  updateProduct,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { buildApiUrl } from "../../lib/api/config";

/** Resolve stored paths to a usable <img src> (absolute URLs unchanged; relative paths use API base). */
function resolveMediaUrl(url) {
  if (url == null || typeof url !== "string") return "";
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  return buildApiUrl(path);
}

const YES_NO = ["Yes", "No"];
const HOURS = Array.from({ length: 13 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const emptyForm = () => ({
  name: "",
  availability: "No",
  vendorId: "",
  categoryId: "",
  serviceId: "",
  sellPrice: "",
  discountAmount: "",
  finalPrice: "",
  taxConfigurationId: "",
  durationHours: 0,
  durationMinutes: 0,
  shortDescription: "",
  longDescription: "",
  promiseP4u: "",
  helpLineNumber: "",
  thumbnailUrl: "",
  bannerUrls: [],
});

const VENDOR_PAGE_SIZE = 100;

/**
 * @param {{ isEdit?: boolean, isView?: boolean, productId?: string }} props
 */
const ProductFormLayer = ({ isEdit = false, isView = false, productId, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [taxItems, setTaxItems] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [entityLoading, setEntityLoading] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingThumbnail, setPendingThumbnail] = useState(null);
  const [pendingBanners, setPendingBanners] = useState([]);
  const pendingThumbnailRef = useRef(null);
  const pendingBannersRef = useRef([]);
  const [thumbnailLoadError, setThumbnailLoadError] = useState(false);
  const [bannerLoadError, setBannerLoadError] = useState({});

  const pendingThumbPreviewUrl = useMemo(
    () => (pendingThumbnail ? URL.createObjectURL(pendingThumbnail) : null),
    [pendingThumbnail],
  );
  const pendingBannerPreviewUrls = useMemo(
    () => pendingBanners.map((f) => URL.createObjectURL(f)),
    [pendingBanners],
  );

  useEffect(() => {
    return () => {
      if (pendingThumbPreviewUrl) URL.revokeObjectURL(pendingThumbPreviewUrl);
    };
  }, [pendingThumbPreviewUrl]);

  useEffect(() => {
    const urls = pendingBannerPreviewUrls;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [pendingBannerPreviewUrls]);

  useEffect(() => {
    setThumbnailLoadError(false);
  }, [formData.thumbnailUrl, pendingThumbnail]);

  useEffect(() => {
    setBannerLoadError({});
  }, [formData.bannerUrls, pendingBanners]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRefsLoading(true);
      try {
        const [vRes, cRes, sRes, tRes] = await Promise.all([
          listVendors({ limit: VENDOR_PAGE_SIZE, offset: 0 }),
          listCategories({ purpose: "all" }),
          listCatalogServices({ limit: 200, offset: 0 }),
          listTaxConfigurations({ purpose: "all" }),
        ]);
        if (!cancelled) {
          setVendors(vRes.items || []);
          setCategories(cRes.items || []);
          setServices(sRes.items || []);
          setTaxItems(tRes.items || []);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : String(e);
          setLoadError((prev) => prev || msg);
          toast.error(`Reference data: ${msg}`);
        }
      } finally {
        if (!cancelled) setRefsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const applyRow = useCallback((row) => {
    setFormData({
      name: row.name || "",
      availability: row.availability ? "Yes" : "No",
      vendorId: row.vendorId || "",
      categoryId: row.categoryId || "",
      serviceId: row.serviceId || "",
      sellPrice: row.sellPrice != null ? String(row.sellPrice) : "",
      discountAmount: row.discountAmount != null ? String(row.discountAmount) : "",
      finalPrice: row.finalPrice != null ? String(row.finalPrice) : "",
      taxConfigurationId: row.taxConfigurationId || "",
      durationHours: row.durationHours ?? 0,
      durationMinutes: row.durationMinutes ?? 0,
      shortDescription: row.shortDescription || "",
      longDescription: row.longDescription || "",
      promiseP4u: row.promiseP4u || "",
      helpLineNumber: row.helpLineNumber || "",
      thumbnailUrl: row.thumbnailUrl || "",
      bannerUrls: Array.isArray(row.bannerUrls) ? row.bannerUrls : [],
    });
  }, []);

  useEffect(() => {
    if (!productId) { setEntityLoading(false); return; }
    let cancelled = false;
    (async () => {
      setEntityLoading(true);
      setLoadError("");
      try {
        const row = await getProduct(productId);
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
  }, [productId, applyRow]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    if (name === "durationHours" || name === "durationMinutes") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const removeBannerUrl = (index) => {
    setFormData((prev) => ({ ...prev, bannerUrls: prev.bannerUrls.filter((_, i) => i !== index) }));
  };

  const removePendingBannerAt = (index) => {
    setPendingBanners((prev) => {
      const next = prev.filter((_, i) => i !== index);
      pendingBannersRef.current = next;
      return next;
    });
  };

  const thumbnailSrc = pendingThumbPreviewUrl || resolveMediaUrl(formData.thumbnailUrl);
  const hasThumbnailPreview = Boolean(thumbnailSrc) && !thumbnailLoadError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;

    // Upload files BEFORE setSubmitting to avoid re-render clearing file refs
    let thumbnailUrl = formData.thumbnailUrl;
    let bannerUrls = [...formData.bannerUrls];

    const thumbFile = pendingThumbnailRef.current || pendingThumbnail;
    if (thumbFile) {
      try {
        const res = await uploadFile(thumbFile);
        thumbnailUrl = res.url;
      } catch (err) {
        toast.error("Thumbnail upload failed");
        return;
      }
    }
    const bannerFiles = pendingBannersRef.current.length > 0 ? pendingBannersRef.current : pendingBanners;
    for (const file of bannerFiles) {
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
        vendorId: formData.vendorId || null,
        categoryId: formData.categoryId || null,
        serviceId: formData.serviceId || null,
        sellPrice: formData.sellPrice || null,
        discountAmount: formData.discountAmount || null,
        finalPrice: formData.finalPrice || null,
        taxConfigurationId: formData.taxConfigurationId || null,
        durationHours: formData.durationHours,
        durationMinutes: formData.durationMinutes,
        shortDescription: formData.shortDescription.trim() || null,
        longDescription: formData.longDescription.trim() || null,
        promiseP4u: formData.promiseP4u.trim() || null,
        helpLineNumber: formData.helpLineNumber.trim() || null,
        thumbnailUrl: thumbnailUrl || null,
        bannerUrls: bannerUrls.length > 0 ? bannerUrls : null,
      };

      if (isEdit && productId) {
        await updateProduct(productId, payload);
        toast.success("Product updated.");
      } else {
        await createProduct(payload);
        toast.success("Product created.");
      }
      if (onSuccess) onSuccess(); else navigate("/product");
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
    pendingThumbnailRef.current = null;
    pendingBannersRef.current = [];
  };

  const disabled = isView || submitting || entityLoading || refsLoading;
  const showSkeleton = Boolean(productId) && entityLoading;

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h4 className="text-lg fw-semibold mb-0">
          {isView ? "View Product" : isEdit ? "Edit Product" : "Add Product"}
        </h4>
      </div>
      <div className="card-body p-24">
        {loadError && productId && !showSkeleton && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">{loadError}</div>
        )}
        {showSkeleton ? (
          <p className="text-secondary-light mb-0">Loading product...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* ── Left: Product Name section ── */}
              <div className="col-md-6">
                <h5 className="text-md fw-semibold mb-16">Product Name</h5>
                <div className="bg-neutral-50 radius-12 p-16 mb-20">
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Name</label>
                    <input type="text" className="form-control radius-8" name="name" value={formData.name} onChange={handleChange} disabled={disabled} maxLength={255} />
                  </div>
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Availability</label>
                    <select className="form-control radius-8 form-select" name="availability" value={formData.availability} onChange={handleChange} disabled={disabled}>
                      {YES_NO.map((o) => (<option key={o} value={o}>{o}</option>))}
                    </select>
                  </div>
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Vendor</label>
                    <select className="form-control radius-8 form-select" name="vendorId" value={formData.vendorId} onChange={handleChange} disabled={disabled}>
                      <option value="">Select...</option>
                      {vendors.map((v) => (<option key={v.id} value={v.id}>{v.businessName || v.ownerName || "Vendor"}</option>))}
                    </select>
                  </div>
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Category</label>
                    <select className="form-control radius-8 form-select" name="categoryId" value={formData.categoryId} onChange={handleChange} disabled={disabled}>
                      <option value="">Select...</option>
                      {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Services</label>
                    <select className="form-control radius-8 form-select" name="serviceId" value={formData.serviceId} onChange={handleChange} disabled={disabled}>
                      <option value="">Select...</option>
                      {services.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                  </div>
                  {(formData.categoryId || formData.serviceId) && (
                    <div className="bg-base radius-8 p-12 border border-neutral-200">
                      <span className="text-xs fw-bold text-secondary-light d-block mb-8">CURRENTLY SELECTED</span>
                      <div className="d-flex gap-8">
                        <div>
                          <span className="text-xs text-secondary-light">Category</span>
                          {formData.categoryId && (
                            <div><span className="px-12 py-4 radius-16 border border-primary-600 text-primary-600 text-xs fw-medium">{categories.find((c) => c.id === formData.categoryId)?.name || "—"}</span></div>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-secondary-light">Service</span>
                          {formData.serviceId && (
                            <div><span className="px-12 py-4 radius-16 border border-success-600 text-success-600 text-xs fw-medium">{services.find((s) => s.id === formData.serviceId)?.name || "—"}</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right: Price section ── */}
              <div className="col-md-6">
                <h5 className="text-md fw-semibold mb-16">Price</h5>
                <div className="bg-neutral-50 radius-12 p-16 mb-20">
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Sell Price</label>
                    <input type="number" className="form-control radius-8" name="sellPrice" value={formData.sellPrice} onChange={handleChange} disabled={disabled} min={0} step="0.01" />
                  </div>
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Discount Amount (&#8377;)</label>
                    <input type="number" className="form-control radius-8" name="discountAmount" value={formData.discountAmount} onChange={handleChange} disabled={disabled} min={0} step="0.01" />
                  </div>
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Final Price (after Discount) Including Tax</label>
                    <input type="number" className="form-control radius-8 bg-neutral-100" name="finalPrice" value={formData.finalPrice} onChange={handleChange} disabled={disabled} min={0} step="0.01" />
                  </div>
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Tax</label>
                    <select className="form-control radius-8 form-select" name="taxConfigurationId" value={formData.taxConfigurationId} onChange={handleChange} disabled={disabled}>
                      <option value="">Select The Tax...</option>
                      {taxItems.map((t) => (<option key={t.id} value={t.id}>{t.title || t.code} ({t.percentage}%)</option>))}
                    </select>
                  </div>
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light text-sm mb-8">Duration Minute</label>
                    <div className="d-flex gap-12 align-items-end">
                      <div>
                        <span className="text-xs text-secondary-light">Hours</span>
                        <select className="form-control radius-8 form-select" name="durationHours" value={formData.durationHours} onChange={handleChange} disabled={disabled}>
                          {HOURS.map((h) => (<option key={h} value={h}>{h} hr</option>))}
                        </select>
                      </div>
                      <div>
                        <span className="text-xs text-secondary-light">Minutes</span>
                        <select className="form-control radius-8 form-select" name="durationMinutes" value={formData.durationMinutes} onChange={handleChange} disabled={disabled}>
                          {MINUTES.map((m) => (<option key={m} value={m}>{m} min</option>))}
                        </select>
                      </div>
                      {(formData.durationHours > 0 || formData.durationMinutes > 0) && (
                        <div>
                          <span className="text-xs text-secondary-light">Summary</span>
                          <div className="px-12 py-6 radius-8 border border-primary-600 text-primary-600 text-sm fw-medium d-flex align-items-center gap-1">
                            <Icon icon="mdi:clock-outline" className="text-md" />
                            {formData.durationHours > 0 ? `${formData.durationHours}hr ` : ""}{formData.durationMinutes > 0 ? `${formData.durationMinutes}min` : ""}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Description section ── */}
            <h5 className="text-md fw-semibold mb-16">Description</h5>
            <div className="row bg-neutral-50 radius-12 p-16 mb-20">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Short Description</label>
                <textarea className="form-control radius-8" name="shortDescription" rows={4} value={formData.shortDescription} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Long Description</label>
                <textarea className="form-control radius-8" name="longDescription" rows={4} value={formData.longDescription} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Promise P4u</label>
                <textarea className="form-control radius-8" name="promiseP4u" rows={4} value={formData.promiseP4u} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Help Line Number</label>
                <textarea className="form-control radius-8" name="helpLineNumber" rows={4} value={formData.helpLineNumber} onChange={handleChange} disabled={disabled} />
              </div>
            </div>

            {/* ── Image section ── */}
            <h5 className="text-md fw-semibold mb-16">Image</h5>
            <div className="row bg-neutral-50 radius-12 p-16 mb-20">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Thumbnail</label>
                {!isView && (
                  <input
                    type="file"
                    className="form-control radius-8 mb-10"
                    accept="image/*"
                    disabled={disabled}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setPendingThumbnail(f);
                        pendingThumbnailRef.current = f;
                      }
                    }}
                  />
                )}
                <div className="border border-neutral-200 bg-base radius-12 p-12 d-flex flex-column align-items-start gap-10" style={{ minHeight: 140 }}>
                  {hasThumbnailPreview ? (
                    <>
                      <a href={thumbnailSrc} target="_blank" rel="noopener noreferrer" className="d-inline-block">
                        <img
                          src={thumbnailSrc}
                          alt="Product thumbnail"
                          className="radius-8 border border-neutral-100"
                          style={{ maxWidth: "100%", width: 220, height: 220, objectFit: "cover", display: "block" }}
                          loading="lazy"
                          onError={() => setThumbnailLoadError(true)}
                        />
                      </a>
                      <span className="text-xs text-secondary-light">Click image to open full size</span>
                    </>
                  ) : thumbnailSrc && thumbnailLoadError ? (
                    <span className="text-sm text-secondary-light">Could not load thumbnail.{" "}
                      <a href={thumbnailSrc} target="_blank" rel="noopener noreferrer" className="text-primary-600">Open URL</a>
                    </span>
                  ) : (
                    <span className="text-sm text-secondary-light mb-0">No thumbnail</span>
                  )}
                </div>
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Banner</label>
                {!isView && (
                  <input
                    type="file"
                    className="form-control radius-8 mb-10"
                    accept="image/*"
                    multiple
                    disabled={disabled}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        const files = [...e.target.files];
                        setPendingBanners(files);
                        pendingBannersRef.current = files;
                      }
                    }}
                  />
                )}
                {(formData.bannerUrls.length > 0 || pendingBannerPreviewUrls.length > 0) ? (
                  <div className="d-flex flex-wrap gap-10 mt-0">
                    {formData.bannerUrls.map((url, i) => {
                      const src = resolveMediaUrl(url);
                      const err = bannerLoadError[`saved-${i}`];
                      return (
                        <div key={`saved-${i}`} className="position-relative">
                          {!err ? (
                            <a href={src} target="_blank" rel="noopener noreferrer" className="d-block">
                              <img
                                src={src}
                                alt={`Banner ${i + 1}`}
                                className="border border-neutral-200 radius-8"
                                style={{ width: 140, height: 88, objectFit: "cover", display: "block" }}
                                loading="lazy"
                                onError={() => setBannerLoadError((prev) => ({ ...prev, [`saved-${i}`]: true }))}
                              />
                            </a>
                          ) : (
                            <span className="text-xs text-secondary-light d-inline-block" style={{ width: 140 }}>
                              Failed to load.{" "}
                              <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary-600">Open</a>
                            </span>
                          )}
                          {!disabled && !isView && (
                            <button
                              type="button"
                              className="position-absolute top-0 end-0 border-0 bg-danger-600 text-white rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 22, height: 22, fontSize: 12, transform: "translate(4px,-4px)" }}
                              onClick={() => removeBannerUrl(i)}
                              aria-label="Remove banner"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {pendingBannerPreviewUrls.map((src, i) => (
                      <div key={`pending-${i}`} className="position-relative">
                        <img
                          src={src}
                          alt={`New banner ${i + 1}`}
                          className="border border-primary-200 radius-8"
                          style={{ width: 140, height: 88, objectFit: "cover", display: "block" }}
                        />
                        {!disabled && !isView && (
                          <button
                            type="button"
                            className="position-absolute top-0 end-0 border-0 bg-danger-600 text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 22, height: 22, fontSize: 12, transform: "translate(4px,-4px)" }}
                            onClick={() => removePendingBannerAt(i)}
                            aria-label="Remove new banner"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-light mb-0">No banner images</p>
                )}
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="d-flex align-items-center justify-content-between mt-24">
              <button type="button" onClick={isView ? (onCancel || (() => navigate(-1))) : handleReset}
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

export default ProductFormLayer;
