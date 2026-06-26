import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { createVendorPlan, updateVendorPlan } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const DEFAULT_FORM = {
  planName: "",
  description: "",
  planType: "local",
  tier: 1,
  price: "0",
  validityDays: 30,
  visibilityType: "radius",
  radiusKm: "5",
  commissionPercent: "10",
  maxUserRedemptionPercent: "5",
  paymentMode: "both",
  promoBannerAds: false,
  promoVideoAds: false,
  promoPriorityListing: false,
  isActive: true,
};

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="d-flex align-items-center justify-content-between py-10 border-bottom border-neutral-200 cursor-pointer mb-0">
      <span className="text-primary-light">{label}</span>
      <div className="form-check form-switch mb-0">
        <input className="form-check-input" type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </div>
    </label>
  );
}

const VendorPlanFormLayer = ({ isEdit = false, initialData = null, onSuccess, onCancel }) => {
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    ...(initialData || {}),
    radiusKm: initialData?.radiusKm ?? (initialData?.visibilityType === "radius" ? "5" : ""),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(() => {
    if (isEdit) return "Edit Vendor Plan";
    const kind = form.planType === "vip" ? "VIP" : "Local";
    return `Add ${kind} Plan`;
  }, [isEdit, form.planType]);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!String(form.planName || "").trim()) {
      setError("Plan name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        planName: String(form.planName).trim(),
        description: String(form.description || "").trim() || null,
        planType: form.planType,
        tier: Number(form.tier) || 1,
        price: String(form.price ?? "0"),
        validityDays: Number(form.validityDays) || 30,
        visibilityType: form.visibilityType,
        radiusKm: form.visibilityType === "radius" ? String(form.radiusKm || "5") : undefined,
        commissionPercent: String(form.commissionPercent ?? "0"),
        maxUserRedemptionPercent: String(form.maxUserRedemptionPercent ?? "0"),
        paymentMode: form.paymentMode,
        promoBannerAds: !!form.promoBannerAds,
        promoVideoAds: !!form.promoVideoAds,
        promoPriorityListing: !!form.promoPriorityListing,
        isActive: !!form.isActive,
      };

      if (isEdit && initialData?.id) await updateVendorPlan(initialData.id, payload);
      else await createVendorPlan(payload);
      onSuccess && onSuccess();
    } catch (e1) {
      setError(e1 instanceof ApiError ? e1.message : String(e1));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pb-4">
      <h4 className="fw-bold mb-20 pe-40">{title}</h4>
      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-20">
          <label className="form-label fw-medium">Plan Name *</label>
          <input
            className="form-control radius-8 h-44-px"
            value={form.planName}
            onChange={(e) => setField("planName", e.target.value)}
            placeholder="e.g. Bronze"
            required
          />
        </div>

        <div className="mb-20">
          <label className="form-label fw-medium">Description</label>
          <div className="border radius-8 overflow-hidden">
            <div className="d-flex align-items-center gap-8 px-12 py-8 border-bottom bg-neutral-50">
              <button type="button" className="btn btn-sm btn-light border-0 px-8 py-4" tabIndex={-1} aria-hidden><strong>B</strong></button>
              <button type="button" className="btn btn-sm btn-light border-0 px-8 py-4" tabIndex={-1} aria-hidden><em>I</em></button>
              <button type="button" className="btn btn-sm btn-light border-0 px-8 py-4 text-decoration-underline" tabIndex={-1} aria-hidden>U</button>
              <span className="ms-auto d-flex align-items-center gap-6 text-secondary-light text-xs">
                <Icon icon="mdi:pencil-outline" className="text-sm" /> Edit
              </span>
            </div>
            <textarea
              className="form-control border-0 radius-0"
              rows={3}
              value={form.description || ""}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Plan description…"
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        <div className="row g-16 mb-20">
          <div className="col-sm-6">
            <label className="form-label fw-medium">Plan Type</label>
            <select className="form-select radius-8 h-44-px" value={form.planType} onChange={(e) => setField("planType", e.target.value)}>
              <option value="local">Local</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div className="col-sm-6">
            <label className="form-label fw-medium">Tier (sort order)</label>
            <input type="number" min={1} className="form-control radius-8 h-44-px" value={form.tier} onChange={(e) => setField("tier", e.target.value)} />
          </div>
        </div>

        <div className="row g-16 mb-20">
          <div className="col-sm-6">
            <label className="form-label fw-medium">Price (₹)</label>
            <input type="number" min={0} step="0.01" className="form-control radius-8 h-44-px" value={form.price} onChange={(e) => setField("price", e.target.value)} />
          </div>
          <div className="col-sm-6">
            <label className="form-label fw-medium">Validity (days)</label>
            <input type="number" min={1} className="form-control radius-8 h-44-px" value={form.validityDays} onChange={(e) => setField("validityDays", e.target.value)} />
          </div>
        </div>

        <div className="mb-20">
          <label className="form-label fw-medium">Visibility Type</label>
          <select className="form-select radius-8 h-44-px" value={form.visibilityType} onChange={(e) => setField("visibilityType", e.target.value)}>
            <option value="radius">Radius Based</option>
            <option value="city">City</option>
            <option value="state">State</option>
            <option value="country">Pan India</option>
          </select>
        </div>

        {form.visibilityType === "radius" && (
          <div className="mb-20">
            <label className="form-label fw-medium">Radius (km)</label>
            <input type="number" min={0.1} step="0.1" className="form-control radius-8 h-44-px" value={form.radiusKm || ""} onChange={(e) => setField("radiusKm", e.target.value)} />
          </div>
        )}

        <div className="row g-16 mb-20">
          <div className="col-sm-6">
            <label className="form-label fw-medium">Vendor to P4U Commission %</label>
            <input type="number" min={0} max={100} step="0.01" className="form-control radius-8 h-44-px" value={form.commissionPercent} onChange={(e) => setField("commissionPercent", e.target.value)} />
          </div>
          <div className="col-sm-6">
            <label className="form-label fw-medium">Max User Redemption %</label>
            <input type="number" min={0} max={100} step="0.01" className="form-control radius-8 h-44-px" value={form.maxUserRedemptionPercent} onChange={(e) => setField("maxUserRedemptionPercent", e.target.value)} />
          </div>
        </div>

        <div className="mb-20">
          <label className="form-label fw-medium">Payment Mode</label>
          <select className="form-select radius-8 h-44-px" value={form.paymentMode} onChange={(e) => setField("paymentMode", e.target.value)}>
            <option value="both">Both</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="mb-24 pt-8 border-top">
          <label className="form-label fw-medium d-block mb-8">Promotion Flags</label>
          <ToggleRow label="Banner Ads" checked={!!form.promoBannerAds} onChange={(v) => setField("promoBannerAds", v)} />
          <ToggleRow label="Video Ads" checked={!!form.promoVideoAds} onChange={(v) => setField("promoVideoAds", v)} />
          <ToggleRow label="Priority Listing" checked={!!form.promoPriorityListing} onChange={(v) => setField("promoPriorityListing", v)} />
          <ToggleRow label="Active" checked={!!form.isActive} onChange={(v) => setField("isActive", v)} />
        </div>

        <button type="submit" className="btn btn-primary w-100 radius-8 py-12 fw-semibold" disabled={saving}>
          {saving ? "Saving…" : "Save Plan"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-link w-100 mt-8 text-secondary-light" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

export default VendorPlanFormLayer;
