import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createVendor, getVendor, listCategories, updateVendor } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const STATUS_OPTIONS = ["pending", "active", "suspended", "rejected"];
const KYC_OPTIONS = ["not_started", "in_progress", "submitted", "verified", "rejected"];

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function categoryKey(c) {
  const slug = (c.slug || "").trim();
  if (slug) return slug;
  return slugify(c.name || "");
}

function normalizeCategoriesFromJson(v) {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === "string" ? x.trim() : x?.slug || x?.name))
      .filter(Boolean);
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    try {
      return normalizeCategoriesFromJson(JSON.parse(t));
    } catch {
      return [t];
    }
  }
  return [];
}

function parseAddressJson(j) {
  const empty = {
    addrLine1: "",
    addrLine2: "",
    addrCity: "",
    addrState: "",
    addrPostal: "",
    addrCountry: "",
  };
  if (j == null) return empty;
  let o = j;
  if (typeof j === "string") {
    const t = j.trim();
    if (!t) return empty;
    try {
      o = JSON.parse(t);
    } catch {
      return { ...empty, addrLine1: t };
    }
  }
  if (typeof o !== "object" || !o) return empty;
  return {
    addrLine1: String(o.line1 ?? o.street ?? o.addressLine1 ?? "").trim(),
    addrLine2: String(o.line2 ?? o.addressLine2 ?? "").trim(),
    addrCity: String(o.city ?? "").trim(),
    addrState: String(o.state ?? o.region ?? "").trim(),
    addrPostal: String(o.postalCode ?? o.pincode ?? o.zip ?? "").trim(),
    addrCountry: String(o.country ?? "").trim(),
  };
}

function buildAddressJson(form) {
  const o = {
    line1: form.addrLine1.trim(),
    line2: form.addrLine2.trim(),
    city: form.addrCity.trim(),
    state: form.addrState.trim(),
    postalCode: form.addrPostal.trim(),
    country: form.addrCountry.trim(),
  };
  return Object.values(o).some(Boolean) ? o : null;
}

const emptyForm = () => ({
  businessName: "",
  ownerName: "",
  email: "",
  phone: "",
  status: "pending",
  kycStatus: "not_started",
  categorySlugs: [],
  newCategoryDraft: "",
  pickCategoryId: "",
  addrLine1: "",
  addrLine2: "",
  addrCity: "",
  addrState: "",
  addrPostal: "",
  addrCountry: "",
  notes: "",
  keycloakUserId: "",
});

/**
 * @param {{ isEdit?: boolean, isView?: boolean, vendorId?: string }} props
 */
const VendorFormLayer = ({ isEdit = false, isView = false, vendorId }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [entityLoading, setEntityLoading] = useState(Boolean(vendorId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listCategories({ purpose: "all" })
      .then((res) => {
        if (!cancelled) setCatalogCategories(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {
        if (!cancelled) setCatalogCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyRow = useCallback((row) => {
    const addr = parseAddressJson(row.addressJson);
    setFormData({
      businessName: row.businessName || "",
      ownerName: row.ownerName || "",
      email: row.email || "",
      phone: row.phone || "",
      status: row.status || "pending",
      kycStatus: row.kycStatus || "not_started",
      categorySlugs: normalizeCategoriesFromJson(row.categoriesJson),
      newCategoryDraft: "",
      pickCategoryId: "",
      ...addr,
      notes: row.notes || "",
      keycloakUserId: row.keycloakUserId || "",
    });
  }, []);

  useEffect(() => {
    if (!vendorId) {
      setEntityLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setEntityLoading(true);
      setLoadError("");
      try {
        const row = await getVendor(vendorId);
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
  }, [vendorId, applyRow]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSlug = (slug) => {
    const s = String(slug || "").trim();
    if (!s) return;
    setFormData((prev) =>
      prev.categorySlugs.includes(s) ? prev : { ...prev, categorySlugs: [...prev.categorySlugs, s] },
    );
  };

  const removeSlug = (slug) => {
    setFormData((prev) => ({
      ...prev,
      categorySlugs: prev.categorySlugs.filter((x) => x !== slug),
    }));
  };

  const addPickedCategory = () => {
    const id = formData.pickCategoryId;
    if (!id) return;
    const c = catalogCategories.find((x) => String(x.id) === String(id));
    if (c) addSlug(categoryKey(c));
    setFormData((prev) => ({ ...prev, pickCategoryId: "" }));
  };

  const addNewCategoryFromInput = () => {
    const raw = formData.newCategoryDraft.trim();
    if (!raw) return;
    addSlug(slugify(raw) || raw.replace(/\s+/g, "-").toLowerCase());
    setFormData((prev) => ({ ...prev, newCategoryDraft: "" }));
  };

  const buildPayload = () => {
    const categoriesJson = formData.categorySlugs.length ? [...formData.categorySlugs] : null;
    const addressJson = buildAddressJson(formData);
    return {
      businessName: formData.businessName.trim(),
      ownerName: formData.ownerName.trim(),
      email: formData.email.trim() ? formData.email.trim() : null,
      phone: formData.phone.trim() ? formData.phone.trim() : null,
      status: formData.status,
      kycStatus: formData.kycStatus,
      categoriesJson,
      addressJson,
      notes: formData.notes.trim() ? formData.notes.trim() : null,
      keycloakUserId: formData.keycloakUserId.trim() ? formData.keycloakUserId.trim() : null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;
    const payload = buildPayload();
    if (!payload.businessName || !payload.ownerName) {
      toast.error("Business name and owner name are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && vendorId) {
        await updateVendor(vendorId, payload);
        toast.success("Vendor updated.");
      } else {
        await createVendor(payload);
        toast.success("Vendor created.");
      }
      navigate("/vendor");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isView || submitting || entityLoading;
  const showSkeleton = Boolean(vendorId) && entityLoading;

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h4 className="text-lg fw-semibold mb-0">
          {isView ? "View Vendor" : isEdit ? "Edit Vendor" : "Add Vendor"}
        </h4>
      </div>
      <div className="card-body p-24">
        {loadError && vendorId && !showSkeleton && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">
            {loadError}
          </div>
        )}
        {showSkeleton ? (
          <p className="text-secondary-light mb-0">Loading vendor...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Business name <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  className="form-control radius-8"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  disabled={disabled}
                  maxLength={255}
                />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                  Owner name <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  className="form-control radius-8"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  disabled={disabled}
                  maxLength={255}
                />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Email</label>
                <input
                  type="email"
                  className="form-control radius-8"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={disabled}
                  maxLength={255}
                />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Phone</label>
                <input
                  type="text"
                  className="form-control radius-8"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={disabled}
                  maxLength={32}
                />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Status</label>
                <select
                  className="form-control radius-8 form-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={disabled}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">KYC status</label>
                <select
                  className="form-control radius-8 form-select"
                  name="kycStatus"
                  value={formData.kycStatus}
                  onChange={handleChange}
                  disabled={disabled}
                >
                  {KYC_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-12 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Categories</label>
                <p className="text-secondary-light text-xs mb-8">
                  Add from catalog or type a new label — stored as a list for the vendor.
                </p>
                <div className="d-flex flex-wrap gap-2 align-items-start mb-12">
                  <select
                    className="form-control radius-8 form-select"
                    style={{ maxWidth: 280 }}
                    value={formData.pickCategoryId}
                    onChange={(e) => setFormData((p) => ({ ...p, pickCategoryId: e.target.value }))}
                    disabled={disabled}
                  >
                    <option value="">Select a category from catalog…</option>
                    {catalogCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.slug ? ` (${c.slug})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm radius-8"
                    disabled={disabled || !formData.pickCategoryId}
                    onClick={addPickedCategory}
                  >
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center mb-12">
                  <input
                    type="text"
                    className="form-control radius-8"
                    style={{ maxWidth: 280 }}
                    name="newCategoryDraft"
                    placeholder="New category (e.g. Home Services)"
                    value={formData.newCategoryDraft}
                    onChange={handleChange}
                    disabled={disabled}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNewCategoryFromInput();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm radius-8"
                    disabled={disabled || !formData.newCategoryDraft.trim()}
                    onClick={addNewCategoryFromInput}
                  >
                    Add custom
                  </button>
                </div>
                {formData.categorySlugs.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {formData.categorySlugs.map((slug) => (
                      <span
                        key={slug}
                        className="d-inline-flex align-items-center gap-1 px-12 py-4 radius-8 bg-neutral-200 text-sm"
                      >
                        {slug}
                        {!disabled && (
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 lh-1 text-danger-600"
                            aria-label={`Remove ${slug}`}
                            onClick={() => removeSlug(slug)}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-secondary-light text-sm">No categories yet.</span>
                )}
              </div>

              <div className="col-md-12 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Address</label>
                <div className="row g-2">
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control radius-8"
                      name="addrLine1"
                      placeholder="Address line 1"
                      value={formData.addrLine1}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control radius-8"
                      name="addrLine2"
                      placeholder="Address line 2 (optional)"
                      value={formData.addrLine2}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control radius-8"
                      name="addrCity"
                      placeholder="City"
                      value={formData.addrCity}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control radius-8"
                      name="addrState"
                      placeholder="State"
                      value={formData.addrState}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control radius-8"
                      name="addrPostal"
                      placeholder="PIN / ZIP"
                      value={formData.addrPostal}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control radius-8"
                      name="addrCountry"
                      placeholder="Country"
                      value={formData.addrCountry}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-12 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Notes</label>
                <textarea
                  className="form-control radius-8"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mt-24">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2"
              >
                <Icon icon="mdi:close-circle-outline" className="text-xl" /> {isView ? "Back" : "Cancel"}
              </button>
              {!isView && (
                <button
                  type="submit"
                  disabled={disabled}
                  className="btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2"
                >
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

export default VendorFormLayer;
