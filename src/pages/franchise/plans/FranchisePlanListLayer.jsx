import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { deleteFranchisePlan, listFranchisePlans, updateFranchisePlan } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";
import FormModal from "../../../components/admin/FormModal";
import { exportCsv, formatInr, PAGE_SIZE, statusBadge } from "../franchiseShared";
import FranchisePlanFormLayer from "./FranchisePlanFormLayer";

export default function FranchisePlanListLayer() {
  const [items, setItems] = useState([]), [total, setTotal] = useState(0), [page, setPage] = useState(1);
  const [tab, setTab] = useState("local"), [search, setSearch] = useState(""), [loading, setLoading] = useState(true), [modal, setModal] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listFranchisePlans({ planType: tab, q: search || undefined, includeInactive: true, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
      setItems(result.items || []); setTotal(result.total || 0);
    } catch (error) { toast.error(error instanceof ApiError ? error.message : String(error)); }
    finally { setLoading(false); }
  }, [tab, search, page]);
  useEffect(() => { load(); }, [load]);
  const remove = async (item) => {
    if (!window.confirm(`Delete plan "${item.planName}"?`)) return;
    try { await deleteFranchisePlan(item.id); toast.success("Plan deleted."); load(); } catch (error) { toast.error(error instanceof ApiError ? error.message : String(error)); }
  };
  const promos = (item) => [item.promoBannerAds && "Banner", item.promoVideoAds && "Video", item.promoPriorityListing && "Priority"].filter(Boolean).join(", ") || "None";
  const toggleActive = async (item) => {
    try { await updateFranchisePlan(item.id, { isActive: !item.isActive }); toast.success(item.isActive ? "Plan deactivated." : "Plan activated."); load(); }
    catch (error) { toast.error(error instanceof ApiError ? error.message : String(error)); }
  };
  return (
    <>
      <div className='mb-20'><h3 className='fw-bold mb-4'>Franchise Plans</h3><p className='text-secondary-light'>Configure franchise plans and pricing</p>
        <div className='btn-group'><button className={`btn ${tab === "local" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => { setTab("local"); setPage(1); }}>Local Plans</button><button className={`btn ${tab === "vip" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => { setTab("vip"); setPage(1); }}>VIP Plans</button></div>
      </div>
      <div className='card radius-12'><div className='card-body p-24'>
        <div className='p4u-admin-filter-row gap-10 mb-20'><input className='form-control' style={{ maxWidth: 360 }} placeholder='Search plans...' value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /><div className='p4u-admin-filter-row__end d-flex gap-8'><button className='btn btn-outline-secondary' onClick={() => exportCsv("franchise-plans", ["Plan","Price","Validity","Coverage","Royalty","Status"], items.map((x) => [x.planName,x.price,x.validityDays,x.visibilityType,x.royaltyPercent,x.isActive ? "Active" : "Inactive"]))}><Icon icon='mdi:download-outline' /> CSV</button><button className='btn btn-primary' onClick={() => setModal({ mode: "add" })}><Icon icon='mdi:plus' /> Add Franchise Plan</button></div></div>
        <div className='table-responsive'><table className='table bordered-table align-middle text-nowrap'><thead><tr><th>PLAN</th><th>PRICE</th><th>VALIDITY</th><th>VISIBILITY</th><th>ROYALTY %</th><th>MAX REDEMPTION %</th><th>PAYMENT</th><th>PROMOTIONS</th><th>EXCLUSIVE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
          {loading ? <tr><td colSpan='11' className='text-center'>Loading...</td></tr> : !items.length ? <tr><td colSpan='11' className='text-center'>No plans found.</td></tr> : items.map((item) => <tr key={item.id}><td><strong>{item.planName}</strong><div className='text-xs text-secondary-light'>{item.metadata?.category || item.supportLevel || "—"}</div></td><td>{formatInr(item.price)}</td><td>{item.validityDays} days</td><td>{item.visibilityType === "radius" ? `${item.radiusKm} KM` : item.visibilityType}</td><td>{item.royaltyPercent}%</td><td>{item.maxUserRedemptionPercent}%</td><td>{item.paymentMode}</td><td>{promos(item)}</td><td>{item.territoryExclusive ? "Yes" : "No"}</td><td><span className={`px-10 py-4 rounded-pill ${statusBadge(item.isActive ? "active" : "terminated")}`}>{item.isActive ? "Active" : "Inactive"}</span></td><td><button className='btn btn-sm btn-outline-primary me-6' onClick={() => setModal({ mode: "view", item })}>View</button><button className='btn btn-sm btn-outline-success me-6' onClick={() => setModal({ mode: "edit", item })}>Edit</button><button className='btn btn-sm btn-outline-warning me-6' onClick={() => toggleActive(item)}>{item.isActive ? "Deactivate" : "Activate"}</button><button className='btn btn-sm btn-outline-danger' onClick={() => remove(item)}>Delete</button></td></tr>)}
        </tbody></table></div>
        <div className='d-flex justify-content-between'><span>Showing {items.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total}</span><div><button className='btn btn-sm btn-light me-6' disabled={page === 1} onClick={() => setPage((x) => x - 1)}>Previous</button><button className='btn btn-sm btn-light' disabled={page * PAGE_SIZE >= total} onClick={() => setPage((x) => x + 1)}>Next</button></div></div>
      </div></div>
      {modal && <FormModal size='lg' onClose={() => setModal(null)}><FranchisePlanFormLayer isEdit={modal.mode === "edit"} isView={modal.mode === "view"} initialData={modal.item || { planType: tab }} onCancel={() => setModal(null)} onSuccess={() => { setModal(null); load(); }} /></FormModal>}
    </>
  );
}
