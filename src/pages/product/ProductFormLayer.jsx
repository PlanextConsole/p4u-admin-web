import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createProduct,
  getProduct,
  listCategories,
  listTaxConfigurations,
  listVendors,
  updateProduct,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const emptyForm = () => ({
  name: "",
  vendorId: "",
  categoryId: "",
  taxConfigurationId: "",
  description: "",
  price: "",
  isActive: true,
});

function normalizePrice(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isNaN(n) || n < 0) return null;
  return String(n);
}

const VENDOR_PAGE_SIZE = 100;

/**
 * @param {{ isEdit?: boolean, isView?: boolean, productId?: string }} props
 */
const ProductFormLayer = ({ isEdit = false, isView = false, productId }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxItems, setTaxItems] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [entityLoading, setEntityLoading] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRefsLoading(true);
      try {
        const [vRes, cRes, tRes] = await Promise.all([
          listVendors({ limit: VENDOR_PAGE_SIZE, offset: 0 }),
          listCategories({ purpose: "all" }),
          listTaxConfigurations({ purpose: "all" }),
        ]);
        if (!cancelled) {
          setVendors(vRes.items || []);
          setCategories(cRes.items || []);
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
    return () => {
      cancelled = true;
    };
  }, []);

  const applyRow = useCallback((row) => {
    setFormData({
      name: row.name || "",
      vendorId: row.vendorId || "",
      categoryId: row.categoryId || "",
      taxConfigurationId: row.taxConfigurationId || "",
      description: row.description || "",
      price: row.price != null ? String(row.price) : "",
      isActive: row.isActive !== false,
    });
  }, []);

  useEffect(() => {
    if (!productId) {
      setEntityLoading(false);
      return;
    }
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
    return () => {
      cancelled = true;
    };
  }, [productId, applyRow]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const priceStr = normalizePrice(formData.price);
    return {
      name: formData.name.trim(),
      vendorId: formData.vendorId ? formData.vendorId : null,
      categoryId: formData.categoryId ? formData.categoryId : null,
      taxConfigurationId: formData.taxConfigurationId ? formData.taxConfigurationId : null,
      description: formData.description.trim() ? formData.description.trim() : null,
      price: priceStr,
      isActive: Boolean(formData.isActive),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;
    const payload = buildPayload();
    if (!payload.price) {
      toast.error("Enter a valid price (number).");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && productId) {
        await updateProduct(productId, payload);
        toast.success("Product updated.");
      } else {
        await createProduct(payload);
        toast.success("Product created.");
      }
      navigate("/product");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isView || submitting || entityLoading || refsLoading;
  const showSkeleton = Boolean(productId) && entityLoading;

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Product" : isEdit ? "Edit Product" : "Add Product"}
        </h4>
      </div>
      <div className='card-body p-24'>
        {loadError && productId && !showSkeleton && (
          <div className='alert alert-danger radius-12 mb-16' role='alert'>
            {loadError}
          </div>
        )}
        {showSkeleton ? (
          <p className='text-secondary-light mb-0'>Loading product...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className='row'>
              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                  Name <span className='text-danger-600'>*</span>
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
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                  Price <span className='text-danger-600'>*</span>
                </label>
                <input
                  type='number'
                  className='form-control radius-8'
                  name='price'
                  value={formData.price}
                  onChange={handleChange}
                  required={!isView}
                  disabled={disabled}
                  min={0}
                  step='0.01'
                />
              </div>

              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Vendor</label>
                <select
                  className='form-control radius-8 form-select'
                  name='vendorId'
                  value={formData.vendorId}
                  onChange={handleChange}
                  disabled={disabled}
                >
                  <option value=''>None</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.businessName || v.ownerName || "Vendor"}
                    </option>
                  ))}
                </select>
              </div>

              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Category</label>
                <select
                  className='form-control radius-8 form-select'
                  name='categoryId'
                  value={formData.categoryId}
                  onChange={handleChange}
                  disabled={disabled}
                >
                  <option value=''>None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || "Category"}
                    </option>
                  ))}
                </select>
              </div>

              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Tax configuration</label>
                <select
                  className='form-control radius-8 form-select'
                  name='taxConfigurationId'
                  value={formData.taxConfigurationId}
                  onChange={handleChange}
                  disabled={disabled}
                >
                  <option value=''>None</option>
                  {taxItems.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title || t.code} ({t.percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className='col-md-6 mb-20 d-flex align-items-end'>
                <div className='form-check style-check mb-16'>
                  <input
                    className='form-check-input border border-neutral-300'
                    type='checkbox'
                    name='isActive'
                    id='product-is-active'
                    checked={formData.isActive}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                  <label className='form-check-label ms-8' htmlFor='product-is-active'>
                    Active
                  </label>
                </div>
              </div>

              <div className='col-md-12 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Description</label>
                <textarea
                  className='form-control radius-8'
                  name='description'
                  rows={5}
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

export default ProductFormLayer;
