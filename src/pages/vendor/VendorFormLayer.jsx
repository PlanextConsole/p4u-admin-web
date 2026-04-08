import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createVendor,
  getVendor,
  listCategories,
  listCatalogServices,
  updateVendor,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const STATUS_OPTIONS = ["not_verified", "pending", "active", "suspended", "rejected"];
const GENDER_OPTIONS = ["Male", "Female", "Other"];
const MEMBERSHIP_OPTIONS = ["basic", "silver", "gold", "platinum"];
const TRENDING_OPTIONS = ["Yes", "No"];

const emptyForm = () => ({
  ownerName: "",
  businessName: "",
  age: "",
  gender: "",
  thumbnailUrl: "",
  bannerUrl: "",
  gst: "",
  pan: "",
  phone: "",
  secondaryPhone: "",
  email: "",
  membershipStatus: "",
  status: "not_verified",
  experience: "",
  trending: "No",
  appliedReferralCode: "",
  aboutBusiness: "",
  // Address
  addrBuildingNumber: "",
  addrAreaLocality: "",
  addrState: "",
  addrCity: "",
  addrLatitude: "",
  addrLongitude: "",
  addrPincode: "",
  addrLandmark: "",
  // Commission
  commissionRate: "",
  // Categories & Services
  categorySlugs: [],
  pickCategoryId: "",
  serviceSlugs: [],
  pickServiceId: "",
  // Documents
  gstCertUrl: "",
  panCardUrl: "",
  // Bank
  bankName: "",
  ifscCode: "",
  accountHolderName: "",
  accountNumber: "",
  branch: "",
  upiId: "",
});

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

function normalizeSlugsFromJson(v) {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === "string" ? x.trim() : x?.slug || x?.name || x?.id))
      .filter(Boolean);
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    try {
      return normalizeSlugsFromJson(JSON.parse(t));
    } catch {
      return [t];
    }
  }
  return [];
}

function parseAddressJson(j) {
  const empty = {
    addrBuildingNumber: "",
    addrAreaLocality: "",
    addrState: "",
    addrCity: "",
    addrLatitude: "",
    addrLongitude: "",
    addrPincode: "",
    addrLandmark: "",
  };
  if (j == null) return empty;
  let o = j;
  if (typeof j === "string") {
    try { o = JSON.parse(j); } catch { return empty; }
  }
  if (typeof o !== "object" || !o) return empty;
  return {
    addrBuildingNumber: String(o.buildingNumber ?? "").trim(),
    addrAreaLocality: String(o.areaLocality ?? "").trim(),
    addrState: String(o.state ?? "").trim(),
    addrCity: String(o.city ?? "").trim(),
    addrLatitude: String(o.latitude ?? "").trim(),
    addrLongitude: String(o.longitude ?? "").trim(),
    addrPincode: String(o.pincode ?? "").trim(),
    addrLandmark: String(o.landmark ?? "").trim(),
  };
}

function buildAddressJson(form) {
  const o = {
    buildingNumber: form.addrBuildingNumber.trim(),
    areaLocality: form.addrAreaLocality.trim(),
    state: form.addrState.trim(),
    city: form.addrCity.trim(),
    latitude: form.addrLatitude.trim(),
    longitude: form.addrLongitude.trim(),
    pincode: form.addrPincode.trim(),
    landmark: form.addrLandmark.trim(),
  };
  return Object.values(o).some(Boolean) ? o : null;
}

function parseBankJson(j) {
  const empty = { bankName: "", ifscCode: "", accountHolderName: "", accountNumber: "", branch: "", upiId: "" };
  if (j == null) return empty;
  let o = j;
  if (typeof j === "string") {
    try { o = JSON.parse(j); } catch { return empty; }
  }
  if (typeof o !== "object" || !o) return empty;
  return {
    bankName: String(o.bankName ?? "").trim(),
    ifscCode: String(o.ifscCode ?? "").trim(),
    accountHolderName: String(o.accountHolderName ?? "").trim(),
    accountNumber: String(o.accountNumber ?? "").trim(),
    branch: String(o.branch ?? "").trim(),
    upiId: String(o.upiId ?? "").trim(),
  };
}

function buildBankJson(form) {
  const o = {
    bankName: form.bankName.trim(),
    ifscCode: form.ifscCode.trim(),
    accountHolderName: form.accountHolderName.trim(),
    accountNumber: form.accountNumber.trim(),
    branch: form.branch.trim(),
    upiId: form.upiId.trim(),
  };
  return Object.values(o).some(Boolean) ? o : null;
}

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
  const [catalogServices, setCatalogServices] = useState([]);
  // Pending file objects (not yet uploaded)
  const [pendingFiles, setPendingFiles] = useState({ thumbnailUrl: null, bannerUrl: null, gstCertUrl: null, panCardUrl: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listCategories({ purpose: "all" }),
      listCatalogServices({ limit: 200, offset: 0 }),
    ])
      .then(([cRes, sRes]) => {
        if (!cancelled) {
          setCatalogCategories(Array.isArray(cRes?.items) ? cRes.items : []);
          setCatalogServices(Array.isArray(sRes?.items) ? sRes.items : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogCategories([]);
          setCatalogServices([]);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const applyRow = useCallback((row) => {
    const addr = parseAddressJson(row.addressJson);
    const bank = parseBankJson(row.bankJson);
    const docs = row.documentsJson || {};
    setFormData({
      ownerName: row.ownerName || "",
      businessName: row.businessName || "",
      age: row.age != null ? String(row.age) : "",
      gender: row.gender || "",
      thumbnailUrl: row.thumbnailUrl || "",
      bannerUrl: row.bannerUrl || "",
      gst: row.gst || "",
      pan: row.pan || "",
      phone: row.phone || "",
      secondaryPhone: row.secondaryPhone || "",
      email: row.email || "",
      membershipStatus: row.membershipStatus || "",
      status: row.status || "not_verified",
      experience: row.experience || "",
      trending: row.trending ? "Yes" : "No",
      appliedReferralCode: row.appliedReferralCode || "",
      aboutBusiness: row.aboutBusiness || "",
      ...addr,
      commissionRate: row.commissionRate != null ? String(row.commissionRate) : "",
      categorySlugs: normalizeSlugsFromJson(row.categoriesJson),
      pickCategoryId: "",
      serviceSlugs: normalizeSlugsFromJson(row.servicesJson),
      pickServiceId: "",
      gstCertUrl: docs.gstCertificateUrl || "",
      panCardUrl: docs.panCardUrl || "",
      ...bank,
    });
  }, []);

  useEffect(() => {
    if (!vendorId) { setEntityLoading(false); return; }
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
    return () => { cancelled = true; };
  }, [vendorId, applyRow]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Category helpers
  const addCategorySlug = (slug) => {
    const s = String(slug || "").trim();
    if (!s) return;
    setFormData((prev) =>
      prev.categorySlugs.includes(s) ? prev : { ...prev, categorySlugs: [...prev.categorySlugs, s] },
    );
  };
  const removeCategorySlug = (slug) => {
    setFormData((prev) => ({ ...prev, categorySlugs: prev.categorySlugs.filter((x) => x !== slug) }));
  };
  const addPickedCategory = () => {
    const id = formData.pickCategoryId;
    if (!id) return;
    const c = catalogCategories.find((x) => String(x.id) === String(id));
    if (c) addCategorySlug(categoryKey(c));
    setFormData((prev) => ({ ...prev, pickCategoryId: "" }));
  };

  // Service helpers
  const addServiceSlug = (slug) => {
    const s = String(slug || "").trim();
    if (!s) return;
    setFormData((prev) =>
      prev.serviceSlugs.includes(s) ? prev : { ...prev, serviceSlugs: [...prev.serviceSlugs, s] },
    );
  };
  const removeServiceSlug = (slug) => {
    setFormData((prev) => ({ ...prev, serviceSlugs: prev.serviceSlugs.filter((x) => x !== slug) }));
  };
  const addPickedService = () => {
    const id = formData.pickServiceId;
    if (!id) return;
    const s = catalogServices.find((x) => String(x.id) === String(id));
    if (s) addServiceSlug(s.name || s.id);
    setFormData((prev) => ({ ...prev, pickServiceId: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;
    setSubmitting(true);
    try {
      // Upload any pending files first
      const uploaded = { ...formData };
      const fileKeys = ["thumbnailUrl", "bannerUrl", "gstCertUrl", "panCardUrl"];
      for (const key of fileKeys) {
        if (pendingFiles[key]) {
          const res = await uploadFile(pendingFiles[key]);
          uploaded[key] = res.url;
        }
      }
      // Update formData with uploaded URLs so buildPayload picks them up
      setFormData(uploaded);

      const categoriesJson = uploaded.categorySlugs?.length ? [...uploaded.categorySlugs] : null;
      const servicesJson = uploaded.serviceSlugs?.length ? [...uploaded.serviceSlugs] : null;
      const addressJson = buildAddressJson(uploaded);
      const bankJson = buildBankJson(uploaded);
      const documentsJson = {};
      if (uploaded.gstCertUrl?.trim()) documentsJson.gstCertificateUrl = uploaded.gstCertUrl.trim();
      if (uploaded.panCardUrl?.trim()) documentsJson.panCardUrl = uploaded.panCardUrl.trim();

      const payload = {
        ownerName: uploaded.ownerName?.trim() || null,
        businessName: uploaded.businessName?.trim() || null,
        age: uploaded.age ? Number(uploaded.age) : null,
        gender: uploaded.gender || null,
        thumbnailUrl: uploaded.thumbnailUrl?.trim() || null,
        bannerUrl: uploaded.bannerUrl?.trim() || null,
        gst: uploaded.gst?.trim() || null,
        pan: uploaded.pan?.trim() || null,
        phone: uploaded.phone?.trim() || null,
        secondaryPhone: uploaded.secondaryPhone?.trim() || null,
        email: uploaded.email?.trim() || null,
        membershipStatus: uploaded.membershipStatus || null,
        status: uploaded.status,
        experience: uploaded.experience?.trim() || null,
        trending: uploaded.trending === "Yes",
        appliedReferralCode: uploaded.appliedReferralCode?.trim() || null,
        aboutBusiness: uploaded.aboutBusiness?.trim() || null,
        categoriesJson,
        servicesJson,
        addressJson,
        commissionRate: uploaded.commissionRate ? uploaded.commissionRate : null,
        documentsJson: Object.keys(documentsJson).length > 0 ? documentsJson : null,
        bankJson,
      };

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

  const handleReset = () => {
    setFormData(emptyForm());
    setPendingFiles({ thumbnailUrl: null, bannerUrl: null, gstCertUrl: null, panCardUrl: null });
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
            {/* ── Basic Info ── */}
            <div className="row">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Name</label>
                <input type="text" className="form-control radius-8" name="ownerName" value={formData.ownerName} onChange={handleChange} disabled={disabled} maxLength={255} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Business Name</label>
                <input type="text" className="form-control radius-8" name="businessName" value={formData.businessName} onChange={handleChange} disabled={disabled} maxLength={255} />
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Age</label>
                <input type="number" className="form-control radius-8" name="age" value={formData.age} onChange={handleChange} disabled={disabled} min={0} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Gender</label>
                <select className="form-control radius-8 form-select" name="gender" value={formData.gender} onChange={handleChange} disabled={disabled}>
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Thumbnail</label>
                <input type="file" className="form-control radius-8" accept="image/*" disabled={disabled}
                  onChange={(e) => { if (e.target.files?.[0]) setPendingFiles((p) => ({ ...p, thumbnailUrl: e.target.files[0] })); }}
                />
                {(pendingFiles.thumbnailUrl || formData.thumbnailUrl) && (
                  <div className="mt-8">
                    <img src={pendingFiles.thumbnailUrl ? URL.createObjectURL(pendingFiles.thumbnailUrl) : formData.thumbnailUrl} alt="Thumbnail" style={{ maxWidth: 120, maxHeight: 120, objectFit: "cover", borderRadius: 8 }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Banner</label>
                <input type="file" className="form-control radius-8" accept="image/*" disabled={disabled}
                  onChange={(e) => { if (e.target.files?.[0]) setPendingFiles((p) => ({ ...p, bannerUrl: e.target.files[0] })); }}
                />
                {(pendingFiles.bannerUrl || formData.bannerUrl) && (
                  <div className="mt-8">
                    <img src={pendingFiles.bannerUrl ? URL.createObjectURL(pendingFiles.bannerUrl) : formData.bannerUrl} alt="Banner" style={{ maxWidth: 200, maxHeight: 100, objectFit: "cover", borderRadius: 8 }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                )}
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Goods and Services Tax (GST)</label>
                <input type="text" className="form-control radius-8" name="gst" value={formData.gst} onChange={handleChange} disabled={disabled} maxLength={64} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Permanent Account Number (PAN)</label>
                <input type="text" className="form-control radius-8" name="pan" value={formData.pan} onChange={handleChange} disabled={disabled} maxLength={64} />
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Mobile Number</label>
                <input type="text" className="form-control radius-8" name="phone" value={formData.phone} onChange={handleChange} disabled={disabled} maxLength={32} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Secondary Phone Number</label>
                <input type="text" className="form-control radius-8" name="secondaryPhone" value={formData.secondaryPhone} onChange={handleChange} disabled={disabled} maxLength={32} />
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Email</label>
                <input type="email" className="form-control radius-8" name="email" value={formData.email} onChange={handleChange} disabled={disabled} maxLength={255} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Membership Status</label>
                <select className="form-control radius-8 form-select" name="membershipStatus" value={formData.membershipStatus} onChange={handleChange} disabled={disabled}>
                  <option value="">Select...</option>
                  {MEMBERSHIP_OPTIONS.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Status</label>
                <select className="form-control radius-8 form-select" name="status" value={formData.status} onChange={handleChange} disabled={disabled}>
                  {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
                </select>
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Experience</label>
                <input type="text" className="form-control radius-8" name="experience" value={formData.experience} onChange={handleChange} disabled={disabled} maxLength={255} />
              </div>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Trending</label>
                <select className="form-control radius-8 form-select" name="trending" value={formData.trending} onChange={handleChange} disabled={disabled}>
                  {TRENDING_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Applied ReferralCode</label>
                <input type="text" className="form-control radius-8" name="appliedReferralCode" value={formData.appliedReferralCode} onChange={handleChange} disabled={disabled} maxLength={64} />
              </div>

              <div className="col-md-12 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">About Business</label>
                <textarea className="form-control radius-8" name="aboutBusiness" rows={4} value={formData.aboutBusiness} onChange={handleChange} disabled={disabled} />
              </div>
            </div>

            {/* ── Service Provider Address Information ── */}
            <h5 className="text-md fw-semibold mb-16 mt-8">Service Provider Address Information</h5>
            <div className="row bg-neutral-50 radius-12 p-16 mb-20">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Building Number</label>
                <input type="text" className="form-control radius-8" name="addrBuildingNumber" value={formData.addrBuildingNumber} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Area/Locality</label>
                <input type="text" className="form-control radius-8" name="addrAreaLocality" value={formData.addrAreaLocality} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">State</label>
                <input type="text" className="form-control radius-8" name="addrState" value={formData.addrState} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">City</label>
                <input type="text" className="form-control radius-8" name="addrCity" value={formData.addrCity} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Latitude</label>
                <input type="text" className="form-control radius-8" name="addrLatitude" value={formData.addrLatitude} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Longitude</label>
                <input type="text" className="form-control radius-8" name="addrLongitude" value={formData.addrLongitude} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Pincode</label>
                <input type="text" className="form-control radius-8" name="addrPincode" value={formData.addrPincode} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Landmark</label>
                <input type="text" className="form-control radius-8" name="addrLandmark" value={formData.addrLandmark} onChange={handleChange} disabled={disabled} />
              </div>
            </div>

            {/* ── Service Provider Commission Rate ── */}
            <h5 className="text-md fw-semibold mb-16 mt-8">Service Provider Commission Rate</h5>
            <div className="row bg-neutral-50 radius-12 p-16 mb-20">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Commission Rate (%)</label>
                <input type="number" className="form-control radius-8" name="commissionRate" value={formData.commissionRate} onChange={handleChange} disabled={disabled} min={0} step="0.01" />
              </div>
            </div>

            {/* ── Service Provider Category/Service Information ── */}
            <h5 className="text-md fw-semibold mb-16 mt-8">Service Provider Category/Service Information</h5>
            <div className="row bg-neutral-50 radius-12 p-16 mb-20">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Categories</label>
                <div className="d-flex gap-2 mb-8">
                  <select className="form-control radius-8 form-select" value={formData.pickCategoryId}
                    onChange={(e) => setFormData((p) => ({ ...p, pickCategoryId: e.target.value }))} disabled={disabled}>
                    <option value="">Select...</option>
                    {catalogCategories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  <button type="button" className="btn btn-outline-primary btn-sm radius-8" disabled={disabled || !formData.pickCategoryId} onClick={addPickedCategory}>Add</button>
                </div>
                {formData.categorySlugs.length > 0 && (
                  <div className="d-flex flex-wrap gap-2">
                    {formData.categorySlugs.map((slug) => (
                      <span key={slug} className="d-inline-flex align-items-center gap-1 px-12 py-4 radius-8 bg-neutral-200 text-sm">
                        {slug}
                        {!disabled && (<button type="button" className="border-0 bg-transparent p-0 lh-1 text-danger-600" onClick={() => removeCategorySlug(slug)}>&times;</button>)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Services</label>
                <div className="d-flex gap-2 mb-8">
                  <select className="form-control radius-8 form-select" value={formData.pickServiceId}
                    onChange={(e) => setFormData((p) => ({ ...p, pickServiceId: e.target.value }))} disabled={disabled}>
                    <option value="">Select a category first...</option>
                    {catalogServices.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                  <button type="button" className="btn btn-outline-primary btn-sm radius-8" disabled={disabled || !formData.pickServiceId} onClick={addPickedService}>Add</button>
                </div>
                {formData.serviceSlugs.length > 0 && (
                  <div className="d-flex flex-wrap gap-2">
                    {formData.serviceSlugs.map((slug) => (
                      <span key={slug} className="d-inline-flex align-items-center gap-1 px-12 py-4 radius-8 bg-neutral-200 text-sm">
                        {slug}
                        {!disabled && (<button type="button" className="border-0 bg-transparent p-0 lh-1 text-danger-600" onClick={() => removeServiceSlug(slug)}>&times;</button>)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Service Provider Business Documents ── */}
            <h5 className="text-md fw-semibold mb-16 mt-8">Service Provider Business Documents</h5>
            <div className="row bg-neutral-50 radius-12 p-16 mb-20">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Goods and Services Tax (GST) Certificate</label>
                <input type="file" className="form-control radius-8" accept="image/*,.pdf" disabled={disabled}
                  onChange={(e) => { if (e.target.files?.[0]) setPendingFiles((p) => ({ ...p, gstCertUrl: e.target.files[0] })); }}
                />
                {(pendingFiles.gstCertUrl || formData.gstCertUrl) && (
                  <div className="mt-8">
                    {pendingFiles.gstCertUrl ? (
                      <span className="text-success-600 text-sm d-flex align-items-center gap-1">
                        <Icon icon="mdi:check-circle-outline" className="text-xl" /> {pendingFiles.gstCertUrl.name} (ready to upload)
                      </span>
                    ) : (
                      <a href={formData.gstCertUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm d-flex align-items-center gap-1">
                        <Icon icon="mdi:file-document-outline" className="text-xl" /> View GST Certificate
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Permanent Account Number (PAN) Card</label>
                <input type="file" className="form-control radius-8" accept="image/*,.pdf" disabled={disabled}
                  onChange={(e) => { if (e.target.files?.[0]) setPendingFiles((p) => ({ ...p, panCardUrl: e.target.files[0] })); }}
                />
                {(pendingFiles.panCardUrl || formData.panCardUrl) && (
                  <div className="mt-8">
                    {pendingFiles.panCardUrl ? (
                      <span className="text-success-600 text-sm d-flex align-items-center gap-1">
                        <Icon icon="mdi:check-circle-outline" className="text-xl" /> {pendingFiles.panCardUrl.name} (ready to upload)
                      </span>
                    ) : (
                      <a href={formData.panCardUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm d-flex align-items-center gap-1">
                        <Icon icon="mdi:file-document-outline" className="text-xl" /> View PAN Card
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Service Provider Bank Information ── */}
            <h5 className="text-md fw-semibold mb-16 mt-8">Service Provider Bank Information</h5>
            <div className="row bg-neutral-50 radius-12 p-16 mb-20">
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Bank Name</label>
                <input type="text" className="form-control radius-8" name="bankName" value={formData.bankName} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">IFSC Code</label>
                <input type="text" className="form-control radius-8" name="ifscCode" value={formData.ifscCode} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Account Holder Name</label>
                <input type="text" className="form-control radius-8" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Account Number</label>
                <input type="text" className="form-control radius-8" name="accountNumber" value={formData.accountNumber} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Branch</label>
                <input type="text" className="form-control radius-8" name="branch" value={formData.branch} onChange={handleChange} disabled={disabled} />
              </div>
              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">UPI ID</label>
                <input type="text" className="form-control radius-8" name="upiId" value={formData.upiId} onChange={handleChange} disabled={disabled} />
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

export default VendorFormLayer;
