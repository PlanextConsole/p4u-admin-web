import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCatalogService,
  getCatalogService,
  listCategories,
  updateCatalogService,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const emptyForm = () => ({
  name: "",
  categoryId: "",
  description: "",
  sortOrder: 0,
  isActive: true,
});

/**
 * @param {{ isEdit?: boolean, isView?: boolean, serviceId?: string }} props
 */
const ServiceFormLayer = ({ isEdit = false, isView = false, serviceId }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(Boolean(serviceId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          toast.error(`Categories: ${msg}`);
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyServiceRow = useCallback((row) => {
    setFormData({
      name: row.name || "",
      categoryId: row.categoryId || "",
      description: row.description || "",
      sortOrder: row.sortOrder ?? 0,
      isActive: row.isActive !== false,
    });
  }, []);

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
        if (!cancelled) applyServiceRow(row);
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
  }, [serviceId, applyServiceRow]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === "sortOrder") {
      if (value === "") {
        setFormData((prev) => ({ ...prev, sortOrder: 0 }));
        return;
      }
      const n = Number(value);
      if (Number.isNaN(n) || n < 0) return;
      setFormData((prev) => ({ ...prev, sortOrder: Math.floor(n) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const sortOrder = Number.parseInt(String(formData.sortOrder), 10);
    return {
      name: formData.name.trim(),
      categoryId: formData.categoryId ? formData.categoryId : null,
      description: formData.description.trim() ? formData.description.trim() : null,
      sortOrder: Number.isFinite(sortOrder) && sortOrder >= 0 ? sortOrder : 0,
      isActive: Boolean(formData.isActive),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit && serviceId) {
        await updateCatalogService(serviceId, payload);
        toast.success("Service updated.");
        navigate("/service");
      } else {
        await createCatalogService(payload);
        toast.success("Service created.");
        navigate("/service");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isView || submitting || serviceLoading || categoriesLoading;
  const showSkeleton = Boolean(serviceId) && serviceLoading;

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Service" : isEdit ? "Edit Service" : "Add Service"}
        </h4>
      </div>
      <div className='card-body p-24'>
        {loadError && serviceId && !showSkeleton && (
          <div className='alert alert-danger radius-12 mb-16' role='alert'>
            {loadError}
          </div>
        )}
        {showSkeleton ? (
          <p className='text-secondary-light mb-0'>Loading service...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className='row'>
              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                  Service name <span className='text-danger-600'>*</span>
                </label>
                <input
                  type='text'
                  className='form-control radius-8'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={disabled}
                  maxLength={255}
                />
              </div>

              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Category</label>
                <select
                  className='form-control radius-8 form-select'
                  name='categoryId'
                  value={formData.categoryId}
                  onChange={handleChange}
                  disabled={disabled || categoriesLoading}
                >
                  <option value=''>No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || "Category"}
                    </option>
                  ))}
                </select>
              </div>

              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Sort order</label>
                <input
                  type='number'
                  min={0}
                  className='form-control radius-8'
                  name='sortOrder'
                  value={formData.sortOrder}
                  onChange={handleChange}
                  disabled={disabled}
                />
              </div>

              <div className='col-md-6 mb-20 d-flex align-items-end'>
                <div className='form-check style-check mb-16'>
                  <input
                    className='form-check-input border border-neutral-300'
                    type='checkbox'
                    name='isActive'
                    id='service-is-active'
                    checked={formData.isActive}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                  <label className='form-check-label ms-8' htmlFor='service-is-active'>
                    Active
                  </label>
                </div>
              </div>

              <div className='col-md-12 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Description</label>
                <textarea
                  className='form-control radius-8'
                  name='description'
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className='d-flex align-items-center justify-content-between mt-24'>
              <button
                type='button'
                onClick={() => navigate(-1)}
                className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
              >
                <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
              </button>

              {!isView && (
                <button
                  type='submit'
                  disabled={disabled}
                  className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
                >
                  <Icon icon='lucide:save' className='text-xl' />{" "}
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
