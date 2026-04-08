import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCatalogService,
  getCatalogService,
  listCategories,
  updateCatalogService,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const YES_NO = ["Yes", "No"];

const emptyForm = () => ({
  name: "",
  categoryId: "",
  availability: "Yes",
  trending: "No",
  iconUrl: "",
  description: "",
});

const ServiceFormLayer = ({ isEdit = false, isView = false, serviceId }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(Boolean(serviceId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingIcon, setPendingIcon] = useState(null);
  const pendingIconRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCategoriesLoading(true);
      try {
        const res = await listCategories({ purpose: "all" });
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
    return () => { cancelled = true; };
  }, []);

  const applyRow = useCallback((row) => {
    setFormData({
      name: row.name || "",
      categoryId: row.categoryId || "",
      availability: row.availability ? "Yes" : "No",
      trending: row.trending ? "Yes" : "No",
      iconUrl: row.iconUrl || "",
      description: row.description || "",
    });
  }, []);

  useEffect(() => {
    if (!serviceId) { setServiceLoading(false); return; }
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
    return () => { cancelled = true; };
  }, [serviceId, applyRow]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;

    // Upload file BEFORE setSubmitting to avoid re-render clearing file ref
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
        iconUrl: iconUrl || null,
        description: formData.description.trim() || null,
      };

      if (isEdit && serviceId) {
        await updateCatalogService(serviceId, payload);
        toast.success("Service updated.");
      } else {
        await createCatalogService(payload);
        toast.success("Service created.");
      }
      navigate("/service");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(emptyForm());
    setPendingIcon(null);
    pendingIconRef.current = null;
  };

  const disabled = isView || submitting || serviceLoading || categoriesLoading;
  const showSkeleton = Boolean(serviceId) && serviceLoading;

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h4 className="text-lg fw-semibold mb-0">
          {isView ? "View Service" : isEdit ? "Edit Service" : "Add Service"}
        </h4>
      </div>
      <div className="card-body p-24">
        {loadError && serviceId && !showSkeleton && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">{loadError}</div>
        )}
        {showSkeleton ? (
          <p className="text-secondary-light mb-0">Loading service...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Service Name</label>
                <input type="text" className="form-control radius-8" name="name" value={formData.name} onChange={handleChange} disabled={disabled} maxLength={255} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Category</label>
                <select className="form-control radius-8 form-select" name="categoryId" value={formData.categoryId} onChange={handleChange} disabled={disabled}>
                  <option value="">Select...</option>
                  {categories.filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Availability</label>
                <select className="form-control radius-8 form-select" name="availability" value={formData.availability} onChange={handleChange} disabled={disabled}>
                  {YES_NO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Trending</label>
                <select className="form-control radius-8 form-select" name="trending" value={formData.trending} onChange={handleChange} disabled={disabled}>
                  {YES_NO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Service Icon</label>
                <input type="file" className="form-control radius-8" accept="image/*" disabled={disabled}
                  onChange={(e) => { if (e.target.files?.[0]) { setPendingIcon(e.target.files[0]); pendingIconRef.current = e.target.files[0]; } }}
                />
                {(pendingIcon || formData.iconUrl) && (
                  <div className="mt-8">
                    <img src={pendingIcon ? URL.createObjectURL(pendingIcon) : formData.iconUrl} alt="Icon" style={{ maxWidth: 80, maxHeight: 80, objectFit: "cover", borderRadius: 8 }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                )}
              </div>
            </div>

            <label className="form-label fw-semibold text-primary-light text-sm mb-8">Description</label>
            <textarea className="form-control radius-8 mb-20" name="description" rows={5} value={formData.description} onChange={handleChange} disabled={disabled} />

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

export default ServiceFormLayer;
