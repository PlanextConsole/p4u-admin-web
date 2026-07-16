import React,{useState}from"react";
import{toast}from"react-toastify";
import{createFranchiseRegistrationPayment,updateFranchiseRegistrationPayment}from"../../../lib/api/adminApi";
import{ApiError}from"../../../lib/api/client";

const defaults={registrationId:"",amount:"0",paymentMode:"offline",paymentStatus:"pending",transactionId:"",gatewayReference:"",paidAt:"",notes:""};
export default function FranchisePaymentFormLayer({initialData,registrations=[],isEdit=false,isView=false,onSuccess,onCancel}){
 const[form,setForm]=useState({...defaults,...(initialData||{}),paidAt:initialData?.paidAt?String(initialData.paidAt).slice(0,10):""}),[saving,setSaving]=useState(false);
 const change=(event)=>setForm((current)=>({...current,[event.target.name]:event.target.value}));
 const submit=async(event)=>{event.preventDefault();if(!form.registrationId)return toast.error("Select a registration.");setSaving(true);try{if(isEdit)await updateFranchiseRegistrationPayment(initialData.id,form);else await createFranchiseRegistrationPayment(form);toast.success(isEdit?"Payment updated.":"Payment recorded.");onSuccess?.();}catch(error){toast.error(error instanceof ApiError?error.message:String(error));}finally{setSaving(false);}};
 const disabled=isView||saving;
 return <form onSubmit={submit} className='px-4 pb-4'><h4 className='fw-bold mb-20'>{isView?"Payment Details":isEdit?"Reconcile Payment":"Record Payment"}</h4><div className='row g-16'>
  <div className='col-12'><label className='form-label'>Registration *</label><select className='form-select' name='registrationId' value={form.registrationId} onChange={change} disabled={disabled||isEdit} required><option value=''>Select registration</option>{registrations.map((item)=><option key={item.id} value={item.id}>{item.applicantName} — {item.businessName||item.id.slice(0,8)} ({item.planName||"No plan"})</option>)}</select></div>
  <Field label='Amount (₹)'><input type='number' min='0' step='.01' className='form-control' name='amount' value={form.amount} onChange={change} disabled={disabled}/></Field>
  <Field label='Payment Mode'><select className='form-select' name='paymentMode' value={form.paymentMode} onChange={change} disabled={disabled}><option value='offline'>Offline</option><option value='online'>Online</option><option value='bank_transfer'>Bank Transfer</option></select></Field>
  <Field label='Payment Status'><select className='form-select' name='paymentStatus' value={form.paymentStatus} onChange={change} disabled={disabled}><option value='pending'>Pending</option><option value='success'>Paid</option><option value='failed'>Failed</option><option value='refunded'>Refunded</option></select></Field>
  <Field label='Paid At'><input type='date' className='form-control' name='paidAt' value={form.paidAt} onChange={change} disabled={disabled}/></Field>
  <Field label='Transaction ID'><input className='form-control' name='transactionId' value={form.transactionId||""} onChange={change} disabled={disabled}/></Field>
  <Field label='Gateway Reference'><input className='form-control' name='gatewayReference' value={form.gatewayReference||""} onChange={change} disabled={disabled}/></Field>
  <div className='col-12'><label className='form-label'>Notes</label><textarea className='form-control' name='notes' value={form.notes||""} onChange={change} disabled={disabled}/></div>
 </div><div className='d-flex justify-content-end gap-10 mt-24'><button type='button' className='btn btn-outline-secondary' onClick={onCancel}>Close</button>{!isView&&<button className='btn btn-primary' disabled={saving}>{saving?"Saving...":"Save Payment"}</button>}</div></form>;
}
const Field=({label,children})=><div className='col-md-6'><label className='form-label'>{label}</label>{children}</div>;
