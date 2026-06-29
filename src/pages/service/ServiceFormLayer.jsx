import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCatalogService,
  getCatalogService,
  listCategoriesForServices,
  updateCatalogService,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";
import MediaLibraryPicker from "../../components/admin/MediaLibraryPicker";

const YES_NO = ["Yes", "No"];

const PRICE_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "starting_from", label: "Starting from" },
  { value: "hourly", label: "Hourly" },
];

const emptyForm = () => ({
  name: "",
  parentCategoryId: "",
  categoryId: "",
  availability: "Yes",
  trending: "No",
  emergency: "No",
  iconUrl: "",
  description: "",
  basePrice: "",
  priceType: "fixed",
  duration: "",
});

const ServiceFormLayer = ({ isEdit = false, isView = false, serviceId, onSuccess, onCancel, onDelete }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("general");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(Boolean(serviceId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingIcon, setPendingIcon] = useState(null);
  const pendingIconRef = useRef(null);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const inModal = Boolean(onCancel);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCategoriesLoading(true);
      try {
        const res = await listCategoriesForServices({ purpose: "all" });
        if (!cancelled) setCategories(res.items || []);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : String(e);
          setLoadError((prev) => prev || msg);
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyRow = useCallback((row) => {
    const pt = row.priceType;
    const priceType =
      pt === "starting_from" || pt === "hourly" || pt === "fixed" ? pt : "fixed";
    setFormData({
      name: row.name || "",
      parentCategoryId: "",
      categoryId: row.categoryId || "",
      availability: row.availability ? "Yes" : "No",
      trending: row.trending ? "Yes" : "No",
      emergency: row.emergency ? "Yes" : "No",
      iconUrl: row.iconUrl || "",
      description: row.description || "",
      basePrice:
        row.basePrice != null && String(row.basePrice).trim() !== ""
          ? String(row.basePrice)
          : "",
      priceType,
      duration: row.duration != null ? String(row.duration) : "",
    });
  }, []);

  const rootCategories = useMemo(
    () => (categories || []).filter((c) => !c.parentId).sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [categories],
  );

  const subcategories = useMemo(() => {
    if (!formData.parentCategoryId) return [];
    return categories.filter((c) => c.parentId === formData.parentCategoryId);
  }, [categories, formData.parentCategoryId]);

  useEffect(() => {
    if (!formData.categoryId || !categories.length) return;
    const chosen = categories.find((c) => c.id === formData.categoryId);
    if (chosen?.parentId) {
      setFormData((prev) =>
        prev.parentCategoryId === chosen.parentId ? prev : { ...prev, parentCategoryId: chosen.parentId || "" },
      );
    }
  }, [formData.categoryId, categories]);

  useEffect(() => {
    if (!serviceId) {
      setServiceLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setServiceLoading(true);
      setLoadError("");
      try {
        const row = await getCatalogService(serviceId);
        if (!cancelled) applyRow(row);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : String(e);
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setServiceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, applyRow]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;

    if (!formData.name?.trim()) {
      toast.error("Enter a service name.");
      return;
    }
    if (!formData.parentCategoryId?.trim()) {
      toast.error("Select service category.");
      return;
    }
    if (!formData.categoryId?.trim()) {
      toast.error("Select service subcategory.");
      return;
    }

    let basePriceVal = null;
    if (formData.basePrice != null && String(formData.basePrice).trim() !== "") {
      const n = Number(String(formData.basePrice).replace(/,/g, ""));
      if (Number.isNaN(n) || n < 0) {
        toast.error("Base price must be a valid number.");
        return;
      }
      basePriceVal = String(n);
    }

    let iconUrl = formData.iconUrl;
    const fileToUpload = pendingIconRef.current || pendingIcon;
    if (fileToUpload) {
      try {
        const res = await uploadFile(fileToUpload);
        iconUrl = res.url;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "File upload failed");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim() || null,
        categoryId: formData.categoryId || null,
        availability: formData.availability === "Yes",
        trending: formData.trending === "Yes",
        emergency: formData.emergency === "Yes",
        iconUrl: iconUrl || null,
        description: formData.description.trim() || null,
        basePrice: basePriceVal,
        priceType: formData.priceType,
        duration: formData.duration?.trim() ? formData.duration.trim() : null,
      };

      if (isEdit && serviceId) {
        await updateCatalogService(serviceId, payload);
        toast.success("Service updated.");
      } else {
        await createCatalogService(payload);
        toast.success("Service created.");
      }
      if (onSuccess) onSuccess();
      else navigate("/service");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isView || submitting || serviceLoading;
  const showSkeleton = Boolean(serviceId) && serviceLoading;
  const categorySelectDisabled = disabled || categoriesLoading;

  const modalTitle = () => {
    const name = formData.name?.trim();
    if (isEdit && name) return `Edit: ${name}`;
    if (isEdit) return "Edit Service";
    return "New Service";
  };

  const cancelAction = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  return (
    <div className={inModal ? "p4u-service-modal" : "card h-100 p-0 radius-12"}>
      {!inModal && (
        <div className="card-header border-bottom bg-base py-16 px-24">
          <h4 className="text-lg fw-semibold mb-0">{modalTitle()}</h4>
        </div>
      )}
      <div className={inModal ? "" : "card-body p-24"}>
        {inModal && (
          <div className="p4u-service-modal__head">
            <span className="p4u-service-modal__icon">
              <Icon icon="mdi:wrench-outline" />
            </span>
            <h4 className="p4u-service-modal__title">{modalTitle()}</h4>
          </div>
        )}
        {loadError && serviceId && !showSkeleton && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">{loadError}</div>
        )}
        {showSkeleton ? (
          <p className="text-secondary-light mb-0">Loading service...</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="p4u-service-tabs">
              <Tab active={activeTab === "general"} label="General" onClick={() => setActiveTab("general")} />
              <Tab active={activeTab === "pricing"} label="Pricing & Slots" onClick={() => setActiveTab("pricing")} />
              <Tab active={activeTab === "descriptions"} label="Descriptions" onClick={() => setActiveTab("descriptions")} />
            </div>

            {activeTab === "general" && (
              <section>
                <div className="p4u-service-form-box">
                  <h6><Icon icon="mdi:image-outline" className="me-1" /> Service Image</h6>
                  {!isView && (
                    <div className="d-flex flex-wrap gap-8 mb-12">
                      <input
                        type="file"
                        className="form-control"
                        style={{ maxWidth: 320 }}
                        accept={IMAGE_ACCEPT}
                        disabled={disabled}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setPendingIcon(e.target.files[0]);
                            pendingIconRef.current = e.target.files[0];
                          }
                        }}
                      />
                      {!disabled && (
                        <button type="button" className="p4u-services-btn-outline" onClick={() => setMediaLibraryOpen(true)}>
                          <Icon icon="mdi:folder-image" /> Media Library
                        </button>
                      )}
                    </div>
                  )}
                  <div className="p4u-service-media-preview">
                    {(pendingIcon || formData.iconUrl) ? (
                      <img
                        src={pendingIcon ? URL.createObjectURL(pendingIcon) : resolveMediaUrl(formData.iconUrl)}
                        alt="Service"
                        style={{ maxWidth: "100%", maxHeight: 140, objectFit: "cover" }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="text-center text-secondary-light text-sm p-3">
                        <Icon icon="mdi:image-plus-outline" className="text-2xl mb-2" />
                        <div>Upload Service Image</div>
                        <div className="text-xs mt-1">Click to open Media Library</div>
                      </div>
                    )}
                  </div>
                  <MediaLibraryPicker
                    open={mediaLibraryOpen}
                    onClose={() => setMediaLibraryOpen(false)}
                    onSelect={(url) => {
                      setFormData((prev) => ({ ...prev, iconUrl: url }));
                      setPendingIcon(null);
                      pendingIconRef.current = null;
                    }}
                  />
                </div>

                <div className="row g-12 mb-16">
                  <Field col="col-md-12" label="Title *">
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={disabled}
                      maxLength={255}
                      placeholder="Service name"
                      required
                    />
                  </Field>
                  <Field col="col-md-6" label="Service category *">
                    <select
                      className="form-select"
                      name="parentCategoryId"
                      value={formData.parentCategoryId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((prev) => ({ ...prev, parentCategoryId: value, categoryId: "" }));
                      }}
                      disabled={categorySelectDisabled}
                      required
                    >
                      <option value="">{categoriesLoading ? "Loading categories…" : "Select category"}</option>
                      {rootCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field col="col-md-6" label="Subcategory *">
                    <select
                      className="form-select"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      disabled={categorySelectDisabled || !formData.parentCategoryId}
                      required
                    >
                      <option value="">
                        {formData.parentCategoryId ? (subcategories.length ? "Select subcategory" : "No subcategories") : "Select category first"}
                      </option>
                      {subcategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field col="col-md-4" label="Availability">
                    <select className="form-select" name="availability" value={formData.availability} onChange={handleChange} disabled={disabled}>
                      {YES_NO.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field col="col-md-4" label="Trending">
                    <select className="form-select" name="trending" value={formData.trending} onChange={handleChange} disabled={disabled}>
                      {YES_NO.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field col="col-md-4" label="Emergency service">
                    <select className="form-select" name="emergency" value={formData.emergency} onChange={handleChange} disabled={disabled}>
                      {YES_NO.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
              </section>
            )}

            {activeTab === "pricing" && (
              <section className="p4u-service-form-box">
                <h5><Icon icon="mdi:currency-inr" className="me-1" /> Base Pricing</h5>
                <div className="row g-12">
                  <Field col="col-md-4" label="Base Price (₹)">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-control"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleChange}
                      disabled={disabled}
                      placeholder="e.g. 499"
                    />
                  </Field>
                  <Field col="col-md-4" label="Price type">
                    <select className="form-select" name="priceType" value={formData.priceType} onChange={handleChange} disabled={disabled}>
                      {PRICE_TYPES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field col="col-md-4" label="Duration">
                    <input
                      type="text"
                      className="form-control"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      disabled={disabled}
                      maxLength={64}
                      placeholder="e.g. 1-2 hours"
                    />
                  </Field>
                </div>
              </section>
            )}

            {activeTab === "descriptions" && (
              <section className="p4u-service-form-box">
                <Field col="col-md-12" label="Description">
                  <textarea
                    className="form-control"
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Service description..."
                  />
                </Field>
              </section>
            )}

            {inModal ? (
              <div className="p4u-service-modal__foot">
                {isEdit && onDelete && !isView ? (
                  <button type="button" onClick={onDelete} className="p4u-services-btn-primary" style={{ marginRight: "auto", background: "#dc2626" }}>
                    <Icon icon="mdi:trash-can-outline" /> Delete
                  </button>
                ) : null}
                <button type="button" onClick={cancelAction} className="p4u-services-btn-outline">Cancel</button>
                {!isView && (
                  <button type="submit" disabled={disabled} className="p4u-services-btn-primary">
                    {submitting ? "Saving..." : isEdit ? "Save" : "Create Service"}
                  </button>
                )}
              </div>
            ) : (
              <div className="d-flex align-items-center justify-content-between mt-24">
                <button type="button" onClick={cancelAction} className="btn border border-danger-600 text-danger-600 radius-8 px-20">
                  {isView ? "Back" : "Reset"}
                </button>
                {!isView && (
                  <button type="submit" disabled={disabled} className="btn btn-primary radius-8 px-20">
                    {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
                  </button>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

const Tab = ({ active, label, onClick }) => (
  <button type="button" onClick={onClick} className={active ? "is-active" : ""}>{label}</button>
);

const Field = ({ col, label, children }) => (
  <div className={col}>
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export default ServiceFormLayer;
