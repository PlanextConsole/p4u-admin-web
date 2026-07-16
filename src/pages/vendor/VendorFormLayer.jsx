import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  createVendor,
  getVendor,
  listCategoriesForProducts,
  listCatalogServices,
  listVendorPlans,
  updateVendor,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_ACCEPT, IMAGE_OR_PDF_ACCEPT } from "../../lib/acceptImages";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { validateVendorForm } from "../../lib/validation/vendorForm";

// Backend generates refs as "VEND" + zero-padded digits (e.g. VEND0000001);
// keep it tolerant of legacy hex-style refs too.
const VEND_REF_RE = /^VEND[a-z0-9]{4,}$/i;

const emptyForm = (kind = "product") => ({
  vendorKind: kind === "service" ? "service" : "product",
  ownerName: "",
  businessName: "",
  vendorRef: "",
  email: "",
  phone: "",
  status: "pending",
  verificationStatus: "pending",
  categorySlug: "",
  gst: "",
  pan: "",
  stateName: "",
  stateCode: "",
  city: "",
  district: "",
  registeredShopAddress: "",
  latitude: "",
  longitude: "",
  originalAddressJson: {},
  thumbnailUrl: "",
  gstCertUrl: "",
  panCardUrl: "",
  bankName: "",
  ifscCode: "",
  accountHolderName: "",
  accountNumber: "",
  commissionRate: "10",
  maxRedemptionPercent: "",
  vendorPlanId: "",
  enrollmentCost: "",
  coverageRadiusKm: "",
  restriction: "",
  selfDelivery: false,
  paymentStatus: "unpaid",
  transactionRef: "",
  selectedServiceIds: [],
});

function normalizeSlugsFromJson(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : x?.slug || x?.name)).filter(Boolean);
  if (typeof v === "string") {
    try {
      return normalizeSlugsFromJson(JSON.parse(v));
    } catch {
      return v.trim() ? [v.trim()] : [];
    }
  }
  return [];
}

function normalizeServiceIdsFromJson(v) {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (typeof x === "string") return x;
        if (typeof x === "object" && x) return x.id || x.serviceId || x.slug || x.name;
        return null;
      })
      .filter(Boolean)
      .map((x) => String(x));
  }
  if (typeof v === "string") {
    try {
      return normalizeServiceIdsFromJson(JSON.parse(v));
    } catch {
      return v.trim() ? [v.trim()] : [];
    }
  }
  return [];
}

function parseBankJson(j) {
  const empty = { bankName: "", ifscCode: "", accountHolderName: "", accountNumber: "" };
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
  };
}

function buildBankJson(form) {
  const o = {
    bankName: form.bankName.trim(),
    ifscCode: form.ifscCode.trim(),
    accountHolderName: form.accountHolderName.trim(),
    accountNumber: form.accountNumber.trim(),
  };
  return Object.values(o).some(Boolean) ? o : null;
}

function planTypeKey(p) {
  return String(p.planType || "").toLowerCase();
}

function formatPlanRupeePrice(p) {
  const n = Number(p.price);
  if (Number.isFinite(n)) return `₹${n.toLocaleString("en-IN")}`;
  return p.price != null ? `₹${String(p.price)}` : "₹0";
}

function formatVendorPlanOptionLabel(p) {
  const mode = String(p.paymentMode || "both").toLowerCase();
  return `${p.planName} – ${formatPlanRupeePrice(p)} (${mode})`;
}

/**
 * @param {{ isEdit?: boolean, isView?: boolean, vendorId?: string, vendorKind: 'product'|'service', onSuccess?: () => void, onCancel?: () => void }} props
 */
const VendorFormLayer = ({ isEdit = false, isView = false, vendorId, vendorKind = "product", onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(() => emptyForm(vendorKind));
  const [activeTab, setActiveTab] = useState("details");
  const [isReadonly, setIsReadonly] = useState(Boolean(isView));
  const [entityLoading, setEntityLoading] = useState(Boolean(vendorId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogServices, setCatalogServices] = useState([]);
  const [vendorPlans, setVendorPlans] = useState([]);
  const [pendingFiles, setPendingFiles] = useState({ thumbnailUrl: null, gstCertUrl: null, panCardUrl: null });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showTechnicalId, setShowTechnicalId] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listCategoriesForProducts({ purpose: "all" }),
      listCatalogServices({ limit: 500, offset: 0 }),
      listVendorPlans({ limit: 200, offset: 0 }),
    ])
      .then(([cRes, sRes, pRes]) => {
        if (!cancelled) {
          setCatalogCategories(Array.isArray(cRes?.items) ? cRes.items : []);
          setCatalogServices(Array.isArray(sRes?.items) ? sRes.items : []);
          setVendorPlans(Array.isArray(pRes?.items) ? pRes.items : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogCategories([]);
          setCatalogServices([]);
          setVendorPlans([]);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const applyRow = useCallback((row) => {
    const bank = parseBankJson(row.bankJson);
    const docs = row.documentsJson || {};
    const categories = normalizeSlugsFromJson(row.categoriesJson);
    const serviceIds = normalizeServiceIdsFromJson(row.servicesJson);
    const address = typeof row.addressJson === "object" && row.addressJson ? row.addressJson : {};
    setFormData({
      vendorKind:
        row.vendorKind === "service" || String(row.vendorType || "").toUpperCase() === "SERVICE"
          ? "service"
          : "product",
      ownerName: row.ownerName || "",
      businessName: row.businessName || "",
      vendorRef: row.vendorRef?.trim() || (row.documentsJson?.vendorRef ? String(row.documentsJson.vendorRef) : ""),
      email: row.email || "",
      phone: row.phone || "",
      status: row.status === "not_verified" ? "pending" : (row.status || "pending"),
      verificationStatus:
        row.status === "rejected"
          ? "rejected"
          : row.status === "pending" || row.status === "not_verified"
            ? "pending"
            : row.status === "active"
              ? "verified"
              : row.status === "suspended"
                ? "deactivated"
                : "pending",
      categorySlug: categories[0] || "",
      gst: row.gst || "",
      pan: row.pan || "",
      stateName: String(address.state || ""),
      stateCode: String(address.stateCode || ""),
      city: String(address.city || ""),
      district: String(address.district || ""),
      registeredShopAddress: String(address.areaLocality || address.buildingNumber || ""),
      latitude: address.latitude != null ? String(address.latitude) : (address.lat != null ? String(address.lat) : ""),
      longitude: address.longitude != null ? String(address.longitude) : (address.lng != null ? String(address.lng) : ""),
      originalAddressJson: address,
      thumbnailUrl: row.thumbnailUrl || "",
      gstCertUrl: docs.gstCertificateUrl || "",
      panCardUrl: docs.panCardUrl || "",
      commissionRate: row.commissionRate != null ? String(row.commissionRate) : "10",
      maxRedemptionPercent: String(row.maxRedemptionPercent || ""),
      vendorPlanId: row.vendorPlanId || "",
      enrollmentCost: String(row.enrollmentCost || ""),
      coverageRadiusKm: String(row.coverageRadiusKm || ""),
      restriction: row.restriction || "",
      selfDelivery: Boolean(row.selfDelivery),
      paymentStatus: row.paymentStatus || "unpaid",
      transactionRef: row.transactionRef || "",
      selectedServiceIds: serviceIds,
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

  useEffect(() => {
    setIsReadonly(Boolean(isView));
  }, [isView]);

  const localVendorPlans = useMemo(
    () => vendorPlans.filter((p) => planTypeKey(p) === "local"),
    [vendorPlans],
  );
  const vipVendorPlans = useMemo(
    () => vendorPlans.filter((p) => planTypeKey(p) === "vip"),
    [vendorPlans],
  );
  const otherVendorPlans = useMemo(
    () => vendorPlans.filter((p) => !["local", "vip"].includes(planTypeKey(p))),
    [vendorPlans],
  );

  const handleChange = (e) => {
    if (isReadonly) return;
    const { name, value, type, checked } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setFormData((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "vendorPlanId") {
        const plan = vendorPlans.find((p) => p.id === value);
        if (plan) {
          // Pre-fill defaults from the selected plan when fields are empty.
          if (!prev.commissionRate || prev.commissionRate === "10") {
            next.commissionRate = plan.commissionPercent != null ? String(plan.commissionPercent) : prev.commissionRate;
          }
          if (!prev.maxRedemptionPercent) {
            next.maxRedemptionPercent = plan.maxUserRedemptionPercent != null ? String(plan.maxUserRedemptionPercent) : prev.maxRedemptionPercent;
          }
          if (!prev.coverageRadiusKm && plan.radiusKm != null) {
            next.coverageRadiusKm = String(plan.radiusKm);
          }
          if (!prev.enrollmentCost && plan.price != null) {
            next.enrollmentCost = String(plan.price);
          }
        }
      }
      if (name === "status") {
        next.verificationStatus =
          value === "active"
            ? "verified"
            : value === "pending"
              ? "pending"
              : value === "rejected"
                ? "rejected"
                : value === "suspended"
                  ? "deactivated"
                  : "pending";
      }
      return next;
    });
  };

  const handleServicesChange = (e) => {
    if (isReadonly) return;
    const value = String(e.target.value || "").trim();
    if (fieldErrors.selectedServiceIds) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.selectedServiceIds;
        return next;
      });
    }
    setFormData((prev) => ({ ...prev, selectedServiceIds: value ? [value] : [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadonly) return;

    const validation = validateVendorForm(formData);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      toast.error(validation.firstMessage || "Please fix the highlighted fields.");
      const firstKey = Object.keys(validation.errors)[0];
      if (["gst", "pan", "stateName", "stateCode", "registeredShopAddress"].includes(firstKey)) {
        setActiveTab("details");
      } else if (["ifscCode", "bankName", "accountHolderName", "accountNumber"].includes(firstKey)) {
        setActiveTab("kyc");
      } else {
        setActiveTab("details");
      }
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const uploaded = { ...formData };
      const fileKeys = ["thumbnailUrl", "gstCertUrl", "panCardUrl"];
      for (const key of fileKeys) {
        if (pendingFiles[key]) {
          const res = await uploadFile(pendingFiles[key]);
          uploaded[key] = res.url;
        }
      }

      const categoriesJson = uploaded.categorySlug ? [uploaded.categorySlug] : null;
      const wantsServices = uploaded.vendorKind === "service" || uploaded.vendorKind === "both";
      const servicesJson =
        wantsServices && Array.isArray(uploaded.selectedServiceIds) && uploaded.selectedServiceIds.length > 0
          ? uploaded.selectedServiceIds
          : null;
      const addressJson = {
        ...(uploaded.originalAddressJson && typeof uploaded.originalAddressJson === "object" ? uploaded.originalAddressJson : {}),
        state: uploaded.stateName || "",
        stateCode: uploaded.stateCode || "",
        city: uploaded.city || "",
        district: uploaded.district || "",
        areaLocality: uploaded.registeredShopAddress || "",
        latitude: uploaded.latitude ? Number(uploaded.latitude) : null,
        longitude: uploaded.longitude ? Number(uploaded.longitude) : null,
      };
      const bankJson = buildBankJson(uploaded);
      const documentsJson = {};
      if (uploaded.gstCertUrl?.trim()) documentsJson.gstCertificateUrl = uploaded.gstCertUrl.trim();
      if (uploaded.panCardUrl?.trim()) documentsJson.panCardUrl = uploaded.panCardUrl.trim();

      const vk = uploaded.vendorKind === "service" ? "service" : uploaded.vendorKind === "both" ? "both" : "product";

      const payload = {
        ownerName: uploaded.ownerName.trim(),
        businessName: uploaded.businessName.trim(),
        vendorRef: uploaded.vendorRef?.trim() || null,
        email: uploaded.email.trim().toLowerCase(),
        phone: String(uploaded.phone).replace(/\D/g, "").slice(-10),
        status: uploaded.status || "pending",
        paymentStatus: uploaded.paymentStatus || "unpaid",
        transactionRef: uploaded.transactionRef?.trim() || null,
        maxRedemptionPercent: uploaded.maxRedemptionPercent ? Number(uploaded.maxRedemptionPercent) : null,
        thumbnailUrl: uploaded.thumbnailUrl?.trim() || null,
        vendorKind: vk,
        vendorType: vk === "both" ? "BOTH" : vk === "service" ? "SERVICE" : "PRODUCT",
        bannerUrl: null,
        gst: uploaded.gst?.trim().toUpperCase() || null,
        pan: uploaded.pan?.trim().toUpperCase() || null,
        secondaryPhone: null,
        membershipStatus: null,
        experience: null,
        trending: false,
        appliedReferralCode: null,
        aboutBusiness: null,
        categoriesJson,
        servicesJson,
        addressJson,
        commissionRate: uploaded.commissionRate ? Number(uploaded.commissionRate) : null,
        vendorPlanId: uploaded.vendorPlanId?.trim() || null,
        enrollmentCost: uploaded.enrollmentCost ? Number(uploaded.enrollmentCost) : null,
        coverageRadiusKm: uploaded.coverageRadiusKm ? Number(uploaded.coverageRadiusKm) : null,
        restriction: uploaded.restriction?.trim() || null,
        selfDelivery: Boolean(uploaded.selfDelivery),
        documentsJson: Object.keys(documentsJson).length > 0 ? documentsJson : null,
        bankJson,
      };

      if (isEdit && vendorId) {
        await updateVendor(vendorId, payload);
        toast.success("Vendor updated.");
      } else {
        const created = await createVendor(payload);
        toast.success(`Vendor created. ID: ${created.vendorRef || created.id}`);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isReadonly || submitting || entityLoading;
  const showSkeleton = Boolean(vendorId) && entityLoading;

  const copyTechnicalId = async () => {
    if (!vendorId) return;
    try {
      await navigator.clipboard.writeText(vendorId);
      toast.success("Database ID copied to clipboard.");
    } catch {
      toast.error("Could not copy database ID.");
    }
  };

  const displayVendorRef =
    formData.vendorRef && VEND_REF_RE.test(String(formData.vendorRef).trim())
      ? String(formData.vendorRef).trim()
      : vendorId
        ? "—"
        : "Generated on save";

  const selectedPlan = useMemo(
    () => vendorPlans.find((p) => p.id === formData.vendorPlanId) || null,
    [vendorPlans, formData.vendorPlanId],
  );

  const categoryLabel = useMemo(() => {
    if (formData.vendorKind === "service") {
      const sid = formData.selectedServiceIds?.[0];
      const svc = catalogServices.find((s) => s.id === sid);
      return svc?.name || "Service Vendor";
    }
    const cat = catalogCategories.find((c) => (c.slug || c.name) === formData.categorySlug);
    return cat?.name || formData.categorySlug || (formData.vendorKind === "service" ? "Service Vendor" : "Product Seller");
  }, [formData, catalogCategories, catalogServices]);

  const verificationLabel = formData.verificationStatus === "verified" ? "Verified" : formData.verificationStatus;
  const paymentLabel = String(formData.paymentStatus || "unpaid").toLowerCase();

  const headerRef =
    formData.vendorRef && VEND_REF_RE.test(String(formData.vendorRef).trim())
      ? String(formData.vendorRef).trim()
      : displayVendorRef !== "Generated on save" && displayVendorRef !== "—"
        ? displayVendorRef
        : "";

  return (
    <div className='p4u-vendor-modal'>
      {loadError && vendorId && !showSkeleton && <div className='alert alert-danger radius-12 mb-16'>{loadError}</div>}
      {showSkeleton ? (
        <p className='text-secondary-light mb-0'>Loading vendor...</p>
      ) : (
        <form onSubmit={handleSubmit} className={isReadonly ? "vendor-form-readonly" : undefined}>
          <div className='p4u-vendor-modal__head'>
            <span className='p4u-vendor-modal__icon'>
              {formData.thumbnailUrl ? (
                <img src={resolveMediaUrl(formData.thumbnailUrl)} alt='' />
              ) : (
                <Icon icon='mdi:storefront-outline' />
              )}
            </span>
            <div className='min-w-0'>
              <h4 className='p4u-vendor-modal__title'>{formData.businessName || (formData.vendorKind === "service" ? "Service vendor" : "Product vendor")}</h4>
              <p className='p4u-vendor-modal__sub'>
                {formData.ownerName || "—"}
                {headerRef ? ` · ${headerRef}` : ""}
              </p>
            </div>
          </div>

          <div className='p4u-vendor-modal__badges'>
            <span className={`p4u-vendor-modal__badge ${formData.verificationStatus === "verified" ? "is-verified" : ""}`}>
              {formData.verificationStatus === "verified" ? <Icon icon='mdi:check-circle-outline' /> : null}
              {verificationLabel}
            </span>
            <span className={`p4u-vendor-modal__badge ${paymentLabel === "paid" ? "is-verified" : "is-unpaid"}`}>
              <Icon icon='mdi:credit-card-outline' /> {paymentLabel}
            </span>
          </div>

          <div className='p4u-vendor-tabs'>
            <TabButton active={activeTab === "details"} label='Details' onClick={() => setActiveTab("details")} />
            <TabButton active={activeTab === "kyc"} label='KYC & Documents' onClick={() => setActiveTab("kyc")} />
            <TabButton active={activeTab === "plan"} label='Plan & Payment' onClick={() => setActiveTab("plan")} />
          </div>

          {activeTab === "details" && (
            <section>
              <div className='p4u-vendor-steps' aria-hidden='true'>
                <span className='p4u-vendor-step is-done' />
                <span className='p4u-vendor-step is-done' />
                <span className={`p4u-vendor-step ${formData.gst || formData.pan ? "is-done" : ""}`} />
                <span className={`p4u-vendor-step ${formData.thumbnailUrl ? "is-done" : ""}`} />
              </div>

              {isReadonly ? (
                <div className='p4u-vendor-field-grid'>
                  <DisplayField label='Owner Name *' value={formData.ownerName || "—"} />
                  <DisplayField label='Business Name *' value={formData.businessName || "—"} />
                  <DisplayField label='Email' value={formData.email || "—"} icon='mdi:email-outline' />
                  <DisplayField label='Mobile' value={formData.phone || "—"} icon='mdi:phone-outline' />
                  {formData.vendorKind === "service" && (
                    <DisplayField label='Service' value={categoryLabel} col='col-12' />
                  )}
                </div>
              ) : (
                <div className='row g-12 mb-16'>
                  <Field col='col-md-6' label='Vendor ID'>
                    <input className='form-control radius-10 bg-neutral-50' value={displayVendorRef} readOnly disabled />
                  </Field>
                  <Field col='col-md-6' label='Owner Name *' error={fieldErrors.ownerName}><input className={`form-control radius-10${fieldErrors.ownerName ? " is-invalid" : ""}`} name='ownerName' value={formData.ownerName} onChange={handleChange} disabled={disabled} /></Field>
                  <Field col='col-md-6' label='Business Name *' error={fieldErrors.businessName}><input className={`form-control radius-10${fieldErrors.businessName ? " is-invalid" : ""}`} name='businessName' value={formData.businessName} onChange={handleChange} disabled={disabled} /></Field>
                  <Field col='col-md-6' label='Email *' error={fieldErrors.email}><input type='email' className={`form-control radius-10${fieldErrors.email ? " is-invalid" : ""}`} name='email' value={formData.email} onChange={handleChange} disabled={disabled} /></Field>
                  <Field col='col-md-6' label='Mobile *' error={fieldErrors.phone}><input className={`form-control radius-10${fieldErrors.phone ? " is-invalid" : ""}`} name='phone' value={formData.phone} onChange={handleChange} disabled={disabled} placeholder='10-digit mobile' /></Field>
                  {(formData.vendorKind === "service" || formData.vendorKind === "both") && (
                    <Field col='col-md-6' label='Services *' error={fieldErrors.selectedServiceIds}>
                      <select className={`form-select radius-10${fieldErrors.selectedServiceIds ? " is-invalid" : ""}`} name='selectedServiceIds' value={formData.selectedServiceIds?.[0] || ""} onChange={handleServicesChange} disabled={disabled}>
                        <option value=''>Select service...</option>
                        {catalogServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field col='col-md-6' label='Status'>
                    <select className='form-select radius-10' name='status' value={formData.status} onChange={handleChange} disabled={disabled}>
                      <option value='active'>Verified</option>
                      <option value='pending'>Pending</option>
                      <option value='rejected'>Rejected</option>
                      <option value='suspended'>Deactivated</option>
                    </select>
                  </Field>
                  <Field col='col-md-6' label='Vendor Type *' error={fieldErrors.vendorKind}>
                    <select className='form-select radius-10' name='vendorKind' value={formData.vendorKind} onChange={handleChange} disabled={disabled || isView} required>
                      <option value='product'>Product Vendor</option>
                      <option value='service'>Service Vendor</option>
                      <option value='both'>Both</option>
                    </select>
                  </Field>
                  <Field col='col-md-12' label={<span className='d-inline-flex align-items-center gap-6'><Icon icon='mdi:crown' className='text-warning-main' /> Vendor Plan</span>}>
                    <select className='form-select radius-10' name='vendorPlanId' value={formData.vendorPlanId} onChange={handleChange} disabled={disabled}>
                      <option value=''>No Plan</option>
                      {localVendorPlans.length > 0 && <optgroup label='LOCAL PLANS'>{localVendorPlans.map((p) => <option key={p.id} value={p.id}>{formatVendorPlanOptionLabel(p)}</option>)}</optgroup>}
                      {vipVendorPlans.length > 0 && <optgroup label='VIP PLANS'>{vipVendorPlans.map((p) => <option key={p.id} value={p.id}>{formatVendorPlanOptionLabel(p)}</option>)}</optgroup>}
                      {otherVendorPlans.length > 0 && <optgroup label='OTHER PLANS'>{otherVendorPlans.map((p) => <option key={p.id} value={p.id}>{formatVendorPlanOptionLabel(p)}</option>)}</optgroup>}
                    </select>
                  </Field>
                </div>
              )}

              {vendorId && !isReadonly ? (
                <div className='border border-neutral-200 radius-12 p-12 mb-16'>
                  <button type='button' className='btn btn-link btn-sm text-secondary-light p-0 text-decoration-none' onClick={() => setShowTechnicalId((v) => !v)}>
                    {showTechnicalId ? "Hide technical ID" : "Show technical ID (for CSV import)"}
                  </button>
                  {showTechnicalId ? (
                    <div className='d-flex flex-wrap align-items-center gap-8 mt-8'>
                      <code className='text-sm text-break mb-0'>{vendorId}</code>
                      <button type='button' className='btn btn-outline-primary-600 btn-sm radius-8' onClick={() => void copyTechnicalId()}>Copy database ID</button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className='p4u-vendor-section'>
                <div className='p4u-vendor-section__head'>
                  <Icon icon='mdi:file-document-outline' className='text-primary-600 text-xl' />
                  <h6>GST & TAX COMPLIANCE</h6>
                  <span className='p4u-vendor-section__tag'>Required for tax invoices</span>
                </div>
                <p className='p4u-vendor-section__note'>These details appear on every customer-facing tax invoice issued under this vendor&apos;s name. CGST/SGST vs IGST split is calculated using the vendor&apos;s state code.</p>
                {isReadonly ? (
                  <div className='p4u-vendor-field-grid'>
                    <DisplayField label='GSTIN (15 chars)' value={formData.gst || "—"} />
                    <DisplayField label='PAN (10 chars)' value={formData.pan || "—"} />
                    <DisplayField label='State Name (place of supply)' value={formData.stateName || "—"} />
                    <DisplayField label='State Code (2 digits)' value={formData.stateCode || "—"} />
                    <DisplayField label='Registered Shop Address (printed on invoice)' value={formData.registeredShopAddress || "—"} col='col-12' />
                  </div>
                ) : (
                  <div className='row g-12'>
                    <Field col='col-md-6' label='GSTIN (15 chars)' error={fieldErrors.gst}><input className={`form-control radius-10${fieldErrors.gst ? " is-invalid" : ""}`} name='gst' value={formData.gst} onChange={handleChange} disabled={disabled} maxLength={15} /></Field>
                    <Field col='col-md-6' label='PAN (10 chars)' error={fieldErrors.pan}><input className={`form-control radius-10${fieldErrors.pan ? " is-invalid" : ""}`} name='pan' value={formData.pan} onChange={handleChange} disabled={disabled} maxLength={10} /></Field>
                    <Field col='col-md-6' label='State Name (place of supply)'><input className='form-control radius-10' name='stateName' value={formData.stateName} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col='col-md-6' label='State Code (2 digits)' error={fieldErrors.stateCode}><input className={`form-control radius-10${fieldErrors.stateCode ? " is-invalid" : ""}`} name='stateCode' value={formData.stateCode} onChange={handleChange} disabled={disabled} maxLength={2} /></Field>
                    <Field col='col-md-6' label='City'><input className='form-control radius-10' name='city' value={formData.city} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col='col-md-6' label='District'><input className='form-control radius-10' name='district' value={formData.district} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col='col-md-12' label='Registered Shop Address (printed on invoice)'><input className='form-control radius-10' name='registeredShopAddress' value={formData.registeredShopAddress} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col='col-md-6' label='Latitude'><input type='number' min='-90' max='90' step='0.0000001' className='form-control radius-10' name='latitude' value={formData.latitude} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col='col-md-6' label='Longitude'><input type='number' min='-180' max='180' step='0.0000001' className='form-control radius-10' name='longitude' value={formData.longitude} onChange={handleChange} disabled={disabled} /></Field>
                  </div>
                )}
              </div>

              <div className='p4u-vendor-section'>
                <div className='p4u-vendor-section__head'>
                  <Icon icon='mdi:camera-outline' className='text-primary-600 text-xl' />
                  <h6>Shop Photo</h6>
                </div>
                {!isReadonly && (
                  <ImageUploadField
                    className="form-control radius-10 mb-12"
                    disabled={disabled}
                    accept={IMAGE_ACCEPT}
                    onFileSelect={(f) => setPendingFiles((p) => ({ ...p, thumbnailUrl: f }))}
                    onLibrarySelect={(url) => {
                      setPendingFiles((p) => ({ ...p, thumbnailUrl: null }));
                      setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
                    }}
                    libraryTitle="Choose shop photo"
                  />
                )}
                <div className='p4u-vendor-shop-photo'>
                  {pendingFiles.thumbnailUrl || formData.thumbnailUrl ? (
                    <img src={pendingFiles.thumbnailUrl ? URL.createObjectURL(pendingFiles.thumbnailUrl) : resolveMediaUrl(formData.thumbnailUrl)} alt='Shop' style={{ maxHeight: 140, objectFit: "cover", borderRadius: 10 }} />
                  ) : (
                    <><Icon icon='mdi:image-off-outline' className='text-2xl mb-4' /><div>No shop photo uploaded</div></>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "kyc" && (
            <section>
              <div className='p4u-vendor-kyc-card'>
                <h6><Icon icon='mdi:file-document-outline' className='text-success-600' /> KYC & Identity Documents</h6>
                <div className='row g-12'>
                  <Field col='col-md-6' label='GST Certificate'>
                    {!isReadonly && <input type='file' className='form-control radius-10' accept={IMAGE_OR_PDF_ACCEPT} disabled={disabled} onChange={(e) => { if (e.target.files?.[0]) setPendingFiles((p) => ({ ...p, gstCertUrl: e.target.files[0] })); }} />}
                    {formData.gstCertUrl ? (
                      <a className='text-primary-600 text-sm d-inline-block mt-8 fw-medium' href={resolveMediaUrl(formData.gstCertUrl)} target='_blank' rel='noreferrer'>View GST document</a>
                    ) : isReadonly ? <p className='text-neutral-600 text-sm mb-0 mt-8'>No file uploaded</p> : null}
                  </Field>
                  <Field col='col-md-6' label='PAN Card'>
                    {!isReadonly && <input type='file' className='form-control radius-10' accept={IMAGE_OR_PDF_ACCEPT} disabled={disabled} onChange={(e) => { if (e.target.files?.[0]) setPendingFiles((p) => ({ ...p, panCardUrl: e.target.files[0] })); }} />}
                    {formData.panCardUrl ? (
                      <a className='text-primary-600 text-sm d-inline-block mt-8 fw-medium' href={resolveMediaUrl(formData.panCardUrl)} target='_blank' rel='noreferrer'>View PAN document</a>
                    ) : isReadonly ? <p className='text-neutral-600 text-sm mb-0 mt-8'>No file uploaded</p> : null}
                  </Field>
                </div>
              </div>

              <div className='p4u-vendor-kyc-card'>
                <h6><Icon icon='mdi:bank-outline' className='text-success-600' /> Bank Details</h6>
                {isReadonly ? (
                  <div className='p4u-vendor-field-grid'>
                    <DisplayField label='Account Holder' value={formData.accountHolderName || "—"} />
                    <DisplayField label='Account Number' value={formData.accountNumber || "—"} />
                    <DisplayField label='IFSC Code' value={formData.ifscCode || "—"} />
                  </div>
                ) : (
                  <div className='row g-12'>
                    <Field col='col-md-6' label='Bank Name'><input className='form-control radius-10' name='bankName' value={formData.bankName} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col='col-md-6' label='IFSC' error={fieldErrors.ifscCode}><input className={`form-control radius-10${fieldErrors.ifscCode ? " is-invalid" : ""}`} name='ifscCode' value={formData.ifscCode} onChange={handleChange} disabled={disabled} maxLength={11} /></Field>
                    <Field col='col-md-6' label='Account Holder'><input className='form-control radius-10' name='accountHolderName' value={formData.accountHolderName} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col='col-md-6' label='Account Number'><input className='form-control radius-10' name='accountNumber' value={formData.accountNumber} onChange={handleChange} disabled={disabled} /></Field>
                  </div>
                )}
              </div>

              <div className='p4u-vendor-kyc-card'>
                <h6><Icon icon='mdi:check-circle-outline' className='text-success-600' /> KYC Verification</h6>
                <p className='mb-8 text-sm'>
                  Current Status:{" "}
                  <span className={`p4u-vendor-pill ${formData.verificationStatus === "verified" ? "is-verified" : "is-pending"}`}>
                    {formData.verificationStatus === "verified" ? "Approved" : formData.verificationStatus}
                  </span>
                </p>
                <div className='p-12 radius-10 bg-neutral-50 text-sm mb-0'>
                  Admin Notes: {formData.verificationStatus === "verified" ? "Approved" : formData.verificationStatus === "rejected" ? "Rejected" : "Pending review"}
                </div>
              </div>
            </section>
          )}

          {activeTab === "plan" && (
            <section>
              <div className='p4u-vendor-plan-name'>
                <label><Icon icon='mdi:crown' /> Vendor Plan</label>
                <strong>{selectedPlan?.planName || "No Plan"}</strong>
              </div>

              <div className='p4u-vendor-metric-grid'>
                <div className='p4u-vendor-metric'>
                  <label className='is-teal'><Icon icon='mdi:percent-outline' /> Vendor to P4U Commission</label>
                  {isReadonly ? (
                    <>
                      <strong>{formData.commissionRate ? `${formData.commissionRate}%` : "—"}</strong>
                      <span>Overrides plan commission</span>
                    </>
                  ) : (
                    <>
                      <input className='form-control radius-10' name='commissionRate' value={formData.commissionRate} onChange={handleChange} disabled={disabled} />
                      <span>Overrides plan commission</span>
                    </>
                  )}
                </div>
                <div className='p4u-vendor-metric'>
                  <label className='is-orange'><Icon icon='mdi:percent-outline' /> Max User Redemption %</label>
                  {isReadonly ? (
                    <>
                      <strong>{formData.maxRedemptionPercent ? `${formData.maxRedemptionPercent}%` : "—"}</strong>
                      <span>Overrides plan redemption</span>
                    </>
                  ) : (
                    <>
                      <input className='form-control radius-10' name='maxRedemptionPercent' value={formData.maxRedemptionPercent} onChange={handleChange} disabled={disabled} />
                      <span>Overrides plan redemption</span>
                    </>
                  )}
                </div>
              </div>

              <div className='p4u-vendor-payment-row'>
                <label><Icon icon='mdi:credit-card-outline' /> Payment Status</label>
                <select className='form-select radius-10' style={{ maxWidth: 200 }} name='paymentStatus' value={formData.paymentStatus} onChange={handleChange} disabled={disabled}>
                  <option value='unpaid'>Unpaid</option>
                  <option value='paid'>Paid</option>
                  <option value='partial'>Partial</option>
                </select>
                <span className={`p4u-vendor-pill ${paymentLabel === "paid" ? "is-paid" : "is-unpaid"}`}>{paymentLabel}</span>
              </div>

              <div className='p4u-vendor-txn-row'>
                <label><Icon icon='mdi:receipt-text-outline' /> Transaction Reference ID</label>
                <input name='transactionRef' value={formData.transactionRef} onChange={handleChange} disabled={disabled} placeholder='Enter transaction ID' />
                {!isReadonly ? (
                  <button type='submit' disabled={submitting} className='p4u-vendors-btn-primary'>{submitting ? "Saving..." : "Save"}</button>
                ) : null}
              </div>

              {!isReadonly ? (
                <div className='row g-12 mb-16'>
                  <Field col='col-md-6' label='Enrollment Cost (₹)'><input type='number' min='0' step='0.01' className='form-control radius-10' name='enrollmentCost' value={formData.enrollmentCost} onChange={handleChange} disabled={disabled} placeholder='Inherits plan price if blank' /></Field>
                  <Field col='col-md-6' label='Coverage Radius (km)'><input type='number' min='0' step='0.1' className='form-control radius-10' name='coverageRadiusKm' value={formData.coverageRadiusKm} onChange={handleChange} disabled={disabled} /></Field>
                  <Field col='col-md-6' label='Restriction (zone)'>
                    <select className='form-select radius-10' name='restriction' value={formData.restriction} onChange={handleChange} disabled={disabled}>
                      <option value=''>— None —</option>
                      <option value='district'>District</option>
                      <option value='state'>State</option>
                      <option value='pan_india'>PAN India</option>
                      <option value='international'>International</option>
                    </select>
                  </Field>
                  <Field col='col-md-6' label='Self Delivery by Vendor'>
                    <div className='form-check form-switch mt-8'>
                      <input className='form-check-input' type='checkbox' name='selfDelivery' checked={formData.selfDelivery} onChange={handleChange} disabled={disabled} id='selfDeliveryCheck' />
                      <label className='form-check-label' htmlFor='selfDeliveryCheck'>{formData.selfDelivery ? "Yes" : "No"}</label>
                    </div>
                  </Field>
                </div>
              ) : null}

              <div className='p4u-vendor-bank-info'>
                <h6><Icon icon='mdi:bank-outline' /> Company Account for Offline Payment</h6>
                <div className='p4u-vendor-field-grid'>
                  <DisplayField label='Account Name' value='Planext4U Pvt Ltd' />
                  <DisplayField label='Account No' value='1234567890123' />
                  <DisplayField label='IFSC' value='SBIN0001234' />
                  <DisplayField label='Bank' value='State Bank of India' />
                </div>
                <p>Share these details with the vendor for offline payment. Once paid, update the payment status and transaction ID above.</p>
              </div>
            </section>
          )}

          <div className='p4u-vendor-modal__foot'>
            <button type='button' onClick={onCancel} className='p4u-vendors-btn-outline'>Close</button>
            {isView && isReadonly && <button type='button' onClick={() => setIsReadonly(false)} className='p4u-vendors-btn-primary'>Edit</button>}
            {!isReadonly && activeTab !== "plan" && <button type='submit' disabled={submitting} className='p4u-vendors-btn-primary'>{submitting ? "Saving..." : "Save"}</button>}
          </div>
        </form>
      )}
    </div>
  );
};

const TabButton = ({ active, label, onClick }) => (
  <button type='button' onClick={onClick} className={active ? "is-active" : ""}>{label}</button>
);

const DisplayField = ({ label, value, icon, col }) => (
  <div
    className='p4u-vendor-display-field'
    style={col === "col-12" ? { gridColumn: "1 / -1" } : undefined}
  >
    <label>{label}</label>
    <strong>{icon ? <Icon icon={icon} className='text-secondary-light' /> : null}{value}</strong>
  </div>
);

const Field = ({ col, label, error, children }) => (
  <div className={col}>
    <label className='form-label fw-semibold text-neutral-700 text-sm mb-8'>{label}</label>
    {children}
    {error ? <div className='invalid-feedback d-block text-sm mt-4'>{error}</div> : null}
  </div>
);

export default VendorFormLayer;
