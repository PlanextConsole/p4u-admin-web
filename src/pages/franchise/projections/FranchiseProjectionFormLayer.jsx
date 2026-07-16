import React,{useState}from"react";
import{toast}from"react-toastify";
import{createFranchiseBusinessProjection,updateFranchiseBusinessProjection}from"../../../lib/api/adminApi";
import{ApiError}from"../../../lib/api/client";

const defaults={registrationId:"",franchiseId:"",planId:"",territoryName:"",city:"",state:"",initialInvestment:"0",franchiseFee:"0",setupCost:"",monthlyOpex:"",projectedMonthlyRevenue:"0",projectedAnnualRevenue:"0",projectedBreakEvenMonths:"",projectedRoiPercent:"",populationEstimate:"",marketNotes:"",status:"draft"};
export default function FranchiseProjectionFormLayer({initialData,registrations=[],franchises=[],plans=[],isEdit=false,isView=false,onSuccess,onCancel}){
 const[form,setForm]=useState({...defaults,...(initialData||{})}),[saving,setSaving]=useState(false);
 const change=(event)=>setForm((current)=>({...current,[event.target.name]:event.target.value}));
 const submit=async(event)=>{event.preventDefault();if(!form.territoryName.trim())return toast.error("Territory name is required.");setSaving(true);try{const payload={...form,registrationId:form.registrationId||null,franchiseId:form.franchiseId||null,planId:form.planId||null};if(isEdit)await updateFranchiseBusinessProjection(initialData.id,payload);else await createFranchiseBusinessProjection(payload);toast.success(isEdit?"Projection updated.":"Projection created.");onSuccess?.();}catch(error){toast.error(error instanceof ApiError?error.message:String(error));}finally{setSaving(false);}};
 const disabled=isView||saving;
 return <form onSubmit={submit} className='px-4 pb-4'><h4 className='fw-bold mb-20'>{isView?"Projection Details":isEdit?"Edit Business Projection":"Add Business Projection"}</h4><div className='row g-16'>
  <Field label='Registration'><select className='form-select' name='registrationId' value={form.registrationId||""} onChange={change} disabled={disabled}><option value=''>None</option>{registrations.map((x)=><option key={x.id} value={x.id}>{x.applicantName} — {x.id.slice(0,8)}</option>)}</select></Field>
  <Field label='Active Franchise'><select className='form-select' name='franchiseId' value={form.franchiseId||""} onChange={change} disabled={disabled}><option value=''>None</option>{franchises.map((x)=><option key={x.id} value={x.id}>{x.franchiseCode} — {x.ownerName}</option>)}</select></Field>
  <Field label='Plan'><select className='form-select' name='planId' value={form.planId||""} onChange={change} disabled={disabled}><option value=''>None</option>{plans.map((x)=><option key={x.id} value={x.id}>{x.planName}</option>)}</select></Field>
  <Field label='Territory Name *'><input className='form-control' name='territoryName' value={form.territoryName} onChange={change} disabled={disabled} required/></Field>
  <Field label='City'><input className='form-control' name='city' value={form.city||""} onChange={change} disabled={disabled}/></Field>
  <Field label='State'><input className='form-control' name='state' value={form.state||""} onChange={change} disabled={disabled}/></Field>
  <Money label='Initial Investment' name='initialInvestment' form={form} change={change} disabled={disabled}/><Money label='Franchise Fee' name='franchiseFee' form={form} change={change} disabled={disabled}/><Money label='Setup Cost' name='setupCost' form={form} change={change} disabled={disabled}/><Money label='Monthly OPEX' name='monthlyOpex' form={form} change={change} disabled={disabled}/><Money label='Projected Monthly Revenue' name='projectedMonthlyRevenue' form={form} change={change} disabled={disabled}/><Money label='Projected Annual Revenue' name='projectedAnnualRevenue' form={form} change={change} disabled={disabled}/>
  <Field label='Break-even (months)'><input type='number' min='0' className='form-control' name='projectedBreakEvenMonths' value={form.projectedBreakEvenMonths??""} onChange={change} disabled={disabled}/></Field>
  <Field label='ROI %'><input type='number' step='.01' className='form-control' name='projectedRoiPercent' value={form.projectedRoiPercent??""} onChange={change} disabled={disabled}/></Field>
  <Field label='Population Estimate'><input type='number' min='0' className='form-control' name='populationEstimate' value={form.populationEstimate??""} onChange={change} disabled={disabled}/></Field>
  <Field label='Status'><select className='form-select' name='status' value={form.status} onChange={change} disabled={disabled}><option value='draft'>Draft</option><option value='submitted'>Submitted</option><option value='approved'>Approved</option><option value='rejected'>Rejected</option></select></Field>
  <div className='col-12'><label className='form-label'>Market Notes</label><textarea rows='3' className='form-control' name='marketNotes' value={form.marketNotes||""} onChange={change} disabled={disabled}/></div>
 </div><div className='d-flex justify-content-end gap-10 mt-24'><button type='button' className='btn btn-outline-secondary' onClick={onCancel}>Close</button>{!isView&&<button className='btn btn-primary' disabled={saving}>{saving?"Saving...":"Save Projection"}</button>}</div></form>;
}
const Field=({label,children})=><div className='col-md-6'><label className='form-label'>{label}</label>{children}</div>;
const Money=({label,name,form,change,disabled})=><Field label={`${label} (₹)`}><input type='number' min='0' step='.01' className='form-control' name={name} value={form[name]??""} onChange={change} disabled={disabled}/></Field>;
