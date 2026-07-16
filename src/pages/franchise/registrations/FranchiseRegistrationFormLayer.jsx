import React, { useState } from "react";
import { toast } from "react-toastify";
import { createFranchiseRegistration, createFranchiseRegistrationPayment, updateFranchiseRegistration, uploadFile } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";
import { formatInr } from "../franchiseShared";

const defaults = { applicantName: "", businessName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "", preferredTerritory: "", investmentBudget: "", experienceYears: "", planId: "", documentsJson: [], adminNotes: "", rejectionReason: "", status: "pending", amountPaid: "0", paymentStatus: "pending", paymentMode: "offline", transactionId: "", paidAt: "", paymentNotes: "" };

export default function FranchiseRegistrationFormLayer({ initialData, plans = [], isEdit = false, isView = false, onSuccess, onCancel }) {
  const [form, setForm] = useState({ ...defaults, ...(initialData || {}), documentsJson: Array.isArray(initialData?.documentsJson) ? initialData.documentsJson : [] });
  const [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const plan = plans.find((item) => item.id === form.planId);
  const upload = async (event) => {
    const files = [...(event.target.files || [])]; if (!files.length) return;
    setUploading(true);
    try { const results = await Promise.all(files.map((file) => uploadFile(file))); setForm((current) => ({ ...current, documentsJson: [...current.documentsJson, ...results.map((item) => item.url)] })); toast.success("Documents uploaded."); }
    catch (error) { toast.error(error instanceof ApiError ? error.message : String(error)); } finally { setUploading(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.applicantName.trim()) return toast.error("Applicant name is required.");
    setSaving(true);
    try {
      const payload = { ...form, applicantName: form.applicantName.trim(), investmentBudget: form.investmentBudget || null, experienceYears: form.experienceYears || null, documentsJson: form.documentsJson };
      const saved = isEdit ? await updateFranchiseRegistration(initialData.id, payload) : await createFranchiseRegistration(payload);
      if (!isEdit && Number(form.amountPaid) > 0) await createFranchiseRegistrationPayment({ registrationId: saved.id, amount: form.amountPaid, paymentMode: form.paymentMode, paymentStatus: form.paymentStatus, transactionId: form.transactionId || null, paidAt: form.paidAt || null, notes: form.paymentNotes || null });
      toast.success(isEdit ? "Registration updated." : "Registration created."); onSuccess?.();
    } catch (error) { toast.error(error instanceof ApiError ? error.message : String(error)); } finally { setSaving(false); }
  };
  const disabled = isView || saving;
  return <form onSubmit={submit} className='px-4 pb-4'><h4 className='fw-bold mb-20'>{isView ? "Registration Details" : isEdit ? "Edit Franchise Registration" : "New Franchise Registration"}</h4>
    <div className='row g-16'>
      <Field label='Applicant Name *'><input className='form-control' name='applicantName' value={form.applicantName} onChange={change} disabled={disabled} required /></Field>
      <Field label='Company Name'><input className='form-control' name='businessName' value={form.businessName || ""} onChange={change} disabled={disabled} /></Field>
      <Field label='Email'><input type='email' className='form-control' name='email' value={form.email || ""} onChange={change} disabled={disabled} /></Field>
      <Field label='Mobile'><input className='form-control' name='phone' value={form.phone || ""} onChange={change} disabled={disabled} /></Field>
      <div className='col-12'><label className='form-label'>Address</label><textarea className='form-control' name='address' value={form.address || ""} onChange={change} disabled={disabled} /></div>
      <Field label='City'><input className='form-control' name='city' value={form.city || ""} onChange={change} disabled={disabled} /></Field>
      <Field label='State'><input className='form-control' name='state' value={form.state || ""} onChange={change} disabled={disabled} /></Field>
      <Field label='Pincode'><input className='form-control' name='pincode' value={form.pincode || ""} onChange={change} disabled={disabled} /></Field>
      <Field label='Preferred Territory'><input className='form-control' name='preferredTerritory' value={form.preferredTerritory || ""} onChange={change} disabled={disabled} /></Field>
      <Field label='Plan *'><select className='form-select' name='planId' value={form.planId || ""} onChange={change} disabled={disabled}><option value=''>Select plan</option>{plans.map((item) => <option key={item.id} value={item.id}>{item.planName} ({formatInr(item.price)})</option>)}</select></Field>
      <Field label='Investment Budget'><input type='number' min='0' className='form-control' name='investmentBudget' value={form.investmentBudget || ""} onChange={change} disabled={disabled} /></Field>
      <Field label='Experience (years)'><input type='number' min='0' className='form-control' name='experienceYears' value={form.experienceYears ?? ""} onChange={change} disabled={disabled} /></Field>
      <Field label='Approval Status'><select className='form-select' name='status' value={form.status} onChange={change} disabled={disabled}><option value='pending'>Pending</option><option value='under_review'>Under Review</option><option value='approved'>Approved</option><option value='rejected'>Rejected</option><option value='payment_pending'>Payment Pending</option><option value='active'>Active</option></select></Field>
      <div className='col-12'><label className='form-label'>Documents</label>{!isView && <input type='file' multiple className='form-control mb-8' onChange={upload} disabled={uploading} />}<div className='small text-secondary-light'>{form.documentsJson.length ? form.documentsJson.map((url, index) => <div key={url + index}><a href={url} target='_blank' rel='noreferrer'>{url}</a></div>) : "No documents"}</div></div>
      <div className='col-12'><label className='form-label'>Admin Notes</label><textarea className='form-control' name='adminNotes' value={form.adminNotes || ""} onChange={change} disabled={disabled} /></div>
      {form.status === "rejected" && <div className='col-12'><label className='form-label'>Rejection Reason</label><textarea className='form-control' name='rejectionReason' value={form.rejectionReason || ""} onChange={change} disabled={disabled} /></div>}
      {!isEdit && !isView && <><div className='col-12'><hr /><h5>Payment Details</h5></div><Field label='Amount Paid (₹)'><input type='number' min='0' className='form-control' name='amountPaid' value={form.amountPaid} onChange={change} /></Field><Field label='Payment Status'><select className='form-select' name='paymentStatus' value={form.paymentStatus} onChange={change}><option value='pending'>Pending</option><option value='success'>Paid</option><option value='failed'>Failed</option></select></Field><Field label='Payment Mode'><select className='form-select' name='paymentMode' value={form.paymentMode} onChange={change}><option value='offline'>Offline</option><option value='online'>Online</option><option value='bank_transfer'>Bank Transfer</option></select></Field><Field label='Payment Date'><input type='date' className='form-control' name='paidAt' value={form.paidAt} onChange={change} /></Field><Field label='Transaction Reference'><input className='form-control' name='transactionId' value={form.transactionId} onChange={change} /></Field><Field label='Payment Notes'><input className='form-control' name='paymentNotes' value={form.paymentNotes} onChange={change} /></Field></>}
    </div><div className='d-flex justify-content-end gap-10 mt-24'><button type='button' className='btn btn-outline-secondary' onClick={onCancel}>Cancel</button>{!isView && <button className='btn btn-primary' disabled={saving || uploading}>{saving ? "Saving..." : "Save Changes"}</button>}</div>
  </form>;
}
const Field = ({ label, children }) => <div className='col-md-6'><label className='form-label'>{label}</label>{children}</div>;
