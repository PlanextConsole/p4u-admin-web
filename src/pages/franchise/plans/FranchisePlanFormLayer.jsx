import React, { useState } from "react";
import { toast } from "react-toastify";
import { createFranchisePlan, updateFranchisePlan } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

const defaults = {
  planName: "", category: "", description: "", securityDeposit: "0", benefits: "", features: "", planType: "local", tier: 1, price: "0", validityDays: 365,
  visibilityType: "radius", radiusKm: "5", royaltyPercent: "0", maxUserRedemptionPercent: "0",
  paymentMode: "both", promoBannerAds: false, promoVideoAds: false, promoPriorityListing: false,
  territoryExclusive: true, trainingIncluded: false, supportLevel: "basic", isActive: true,
};

const Toggle = ({ label, name, checked, onChange, disabled }) => (
  <label className='form-check form-switch d-flex align-items-center gap-10 mb-12'>
    <input className='form-check-input' type='checkbox' name={name} checked={checked} onChange={onChange} disabled={disabled} />
    <span>{label}</span>
  </label>
);

export default function FranchisePlanFormLayer({ initialData, isEdit = false, isView = false, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    ...defaults, ...(initialData || {}),
    category: initialData?.metadata?.category || "",
    securityDeposit: initialData?.metadata?.securityDeposit || "0",
    benefits: Array.isArray(initialData?.metadata?.benefits) ? initialData.metadata.benefits.join("\n") : "",
    features: Array.isArray(initialData?.metadata?.features) ? initialData.metadata.features.join("\n") : "",
  });
  const [saving, setSaving] = useState(false);
  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.planName.trim()) return toast.error("Plan name is required.");
    setSaving(true);
    try {
      const payload = {
        ...form, planName: form.planName.trim(), tier: Number(form.tier), validityDays: Number(form.validityDays),
        radiusKm: form.visibilityType === "radius" ? String(form.radiusKm || 0) : null,
        price: String(form.price || 0), royaltyPercent: String(form.royaltyPercent || 0),
        maxUserRedemptionPercent: String(form.maxUserRedemptionPercent || 0),
        metadata: {
          ...(initialData?.metadata || {}),
          category: form.category.trim() || null,
          securityDeposit: String(form.securityDeposit || 0),
          benefits: form.benefits.split("\n").map((item) => item.trim()).filter(Boolean),
          features: form.features.split("\n").map((item) => item.trim()).filter(Boolean),
        },
      };
      if (isEdit) await updateFranchisePlan(initialData.id, payload); else await createFranchisePlan(payload);
      toast.success(isEdit ? "Franchise plan updated." : "Franchise plan created.");
      onSuccess?.();
    } catch (error) { toast.error(error instanceof ApiError ? error.message : String(error)); }
    finally { setSaving(false); }
  };
  const disabled = isView || saving;
  return (
    <form onSubmit={submit} className='px-4 pb-4'>
      <h4 className='fw-bold mb-20'>{isView ? "Franchise Plan" : isEdit ? "Edit Franchise Plan" : "Add Franchise Plan"}</h4>
      <div className='row g-16'>
        <Field label='Plan Name *'><input className='form-control' name='planName' value={form.planName} onChange={change} disabled={disabled} required /></Field>
        <Field label='Plan Type'><select className='form-select' name='planType' value={form.planType} onChange={change} disabled={disabled}><option value='local'>Local</option><option value='vip'>VIP</option></select></Field>
        <Field label='Category'><input className='form-control' name='category' value={form.category} onChange={change} disabled={disabled} placeholder='e.g. Micro' /></Field>
        <Field label='Tier / Sort Order'><input type='number' min='1' className='form-control' name='tier' value={form.tier} onChange={change} disabled={disabled} /></Field>
        <Field label='Price (₹)'><input type='number' min='0' step='.01' className='form-control' name='price' value={form.price} onChange={change} disabled={disabled} /></Field>
        <Field label='Security Deposit (₹)'><input type='number' min='0' step='.01' className='form-control' name='securityDeposit' value={form.securityDeposit} onChange={change} disabled={disabled} /></Field>
        <Field label='Validity (days)'><input type='number' min='1' className='form-control' name='validityDays' value={form.validityDays} onChange={change} disabled={disabled} /></Field>
        <Field label='Coverage Type'><select className='form-select' name='visibilityType' value={form.visibilityType} onChange={change} disabled={disabled}><option value='radius'>Radius</option><option value='city'>City</option><option value='state'>State</option><option value='country'>Country</option></select></Field>
        {form.visibilityType === "radius" && <Field label='Delivery Radius (KM)'><input type='number' min='0' step='.1' className='form-control' name='radiusKm' value={form.radiusKm} onChange={change} disabled={disabled} /></Field>}
        <Field label='Royalty %'><input type='number' min='0' max='100' step='.01' className='form-control' name='royaltyPercent' value={form.royaltyPercent} onChange={change} disabled={disabled} /></Field>
        <Field label='Max User Redemption %'><input type='number' min='0' max='100' step='.01' className='form-control' name='maxUserRedemptionPercent' value={form.maxUserRedemptionPercent} onChange={change} disabled={disabled} /></Field>
        <Field label='Payment Mode'><select className='form-select' name='paymentMode' value={form.paymentMode} onChange={change} disabled={disabled}><option value='both'>Both</option><option value='online'>Online</option><option value='offline'>Offline</option></select></Field>
        <Field label='Support Level'><select className='form-select' name='supportLevel' value={form.supportLevel || ""} onChange={change} disabled={disabled}><option value=''>None</option><option value='basic'>Basic</option><option value='premium'>Premium</option><option value='enterprise'>Enterprise</option></select></Field>
        <div className='col-12'><label className='form-label'>Description</label><textarea rows='3' className='form-control' name='description' value={form.description || ""} onChange={change} disabled={disabled} /></div>
        <div className='col-md-6'><label className='form-label'>Benefits (one per line)</label><textarea rows='4' className='form-control' name='benefits' value={form.benefits} onChange={change} disabled={disabled} /></div>
        <div className='col-md-6'><label className='form-label'>Features Included (one per line)</label><textarea rows='4' className='form-control' name='features' value={form.features} onChange={change} disabled={disabled} /></div>
        <div className='col-12 border-top pt-16'>
          <div className='row'>
            <div className='col-md-6'><Toggle label='Banner Ads' name='promoBannerAds' checked={!!form.promoBannerAds} onChange={change} disabled={disabled} /><Toggle label='Video Ads' name='promoVideoAds' checked={!!form.promoVideoAds} onChange={change} disabled={disabled} /><Toggle label='Priority Listing' name='promoPriorityListing' checked={!!form.promoPriorityListing} onChange={change} disabled={disabled} /></div>
            <div className='col-md-6'><Toggle label='Territory Exclusive' name='territoryExclusive' checked={!!form.territoryExclusive} onChange={change} disabled={disabled} /><Toggle label='Training Included' name='trainingIncluded' checked={!!form.trainingIncluded} onChange={change} disabled={disabled} /><Toggle label='Active' name='isActive' checked={!!form.isActive} onChange={change} disabled={disabled} /></div>
          </div>
        </div>
      </div>
      <div className='d-flex justify-content-end gap-10 mt-24'><button type='button' className='btn btn-outline-secondary' onClick={onCancel}>Cancel</button>{!isView && <button className='btn btn-primary' disabled={saving}>{saving ? "Saving..." : "Save Plan"}</button>}</div>
    </form>
  );
}

const Field = ({ label, children }) => <div className='col-md-6'><label className='form-label'>{label}</label>{children}</div>;
