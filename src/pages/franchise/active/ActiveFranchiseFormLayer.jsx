import React, { useState } from "react";
import { toast } from "react-toastify";
import { updateActiveFranchise } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

export default function ActiveFranchiseFormLayer({ initialData, isView = false, onSuccess, onCancel }) {
  const [form,setForm]=useState({...initialData}),[saving,setSaving]=useState(false);
  const change=(event)=>setForm((current)=>({...current,[event.target.name]:event.target.value}));
  const submit=async(event)=>{event.preventDefault();setSaving(true);try{await updateActiveFranchise(initialData.id,form);toast.success("Franchise updated.");onSuccess?.();}catch(error){toast.error(error instanceof ApiError?error.message:String(error));}finally{setSaving(false);}};
  const disabled=isView||saving;
  return <form onSubmit={submit} className='px-4 pb-4'><h4 className='fw-bold mb-20'>{isView?"Franchise Details":"Edit Franchise"}</h4><div className='row g-16'>
    <Field label='Franchise Code'><input className='form-control' value={form.franchiseCode||""} disabled /></Field>
    <Field label='Business Name'><input className='form-control' name='businessName' value={form.businessName||""} onChange={change} disabled={disabled} /></Field>
    <Field label='Owner Name *'><input className='form-control' name='ownerName' value={form.ownerName||""} onChange={change} disabled={disabled} required /></Field>
    <Field label='Email'><input className='form-control' name='email' value={form.email||""} onChange={change} disabled={disabled} /></Field>
    <Field label='Phone'><input className='form-control' name='phone' value={form.phone||""} onChange={change} disabled={disabled} /></Field>
    <Field label='City'><input className='form-control' name='city' value={form.city||""} onChange={change} disabled={disabled} /></Field>
    <Field label='State'><input className='form-control' name='state' value={form.state||""} onChange={change} disabled={disabled} /></Field>
    <Field label='Pincode'><input className='form-control' name='pincode' value={form.pincode||""} onChange={change} disabled={disabled} /></Field>
    <div className='col-12'><label className='form-label'>Address</label><textarea className='form-control' name='address' value={form.address||""} onChange={change} disabled={disabled} /></div>
    <div className='col-12'><label className='form-label'>Territory</label><textarea className='form-control' name='territoryDescription' value={form.territoryDescription||""} onChange={change} disabled={disabled} /></div>
    <Field label='Plan Start'><input type='date' className='form-control' name='planStartDate' value={String(form.planStartDate||"").slice(0,10)} onChange={change} disabled={disabled} /></Field>
    <Field label='Plan End'><input type='date' className='form-control' name='planEndDate' value={String(form.planEndDate||"").slice(0,10)} onChange={change} disabled={disabled} /></Field>
    <Field label='Payment Status'><select className='form-select' name='paymentStatus' value={form.paymentStatus||"pending"} onChange={change} disabled={disabled}><option value='paid'>Paid</option><option value='pending'>Pending</option><option value='unpaid'>Unpaid</option><option value='refunded'>Refunded</option></select></Field>
    <Field label='Royalty %'><input type='number' min='0' max='100' step='.01' className='form-control' name='royaltyPercent' value={form.royaltyPercent||0} onChange={change} disabled={disabled} /></Field>
  </div><div className='d-flex justify-content-end gap-10 mt-24'><button type='button' className='btn btn-outline-secondary' onClick={onCancel}>Close</button>{!isView&&<button className='btn btn-primary' disabled={saving}>{saving?"Saving...":"Save Changes"}</button>}</div></form>;
}
const Field=({label,children})=><div className='col-md-6'><label className='form-label'>{label}</label>{children}</div>;
