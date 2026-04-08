import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCustomer, updateCustomer } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const CustomerFormLayer = ({ isEdit = false, isView = false, customerId }) => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editStatus, setEditStatus] = useState("");

  const apply = useCallback((row) => {
    setCustomer(row);
    setEditStatus(row.status || "active");
  }, []);

  useEffect(() => {
    if (!customerId) { setLoading(false); setLoadError("Missing customer id."); return; }
    let c = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const row = await getCustomer(customerId);
        if (!c) apply(row);
      } catch (e) {
        if (!c) { const msg = e instanceof ApiError ? e.message : String(e); setLoadError(msg); toast.error(msg); }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => { c = true; };
  }, [customerId, apply]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isView || !customerId) return;
    setSubmitting(true);
    try {
      const updated = await updateCustomer(customerId, { status: editStatus.trim() || "active" });
      apply(updated);
      toast.success("Customer updated.");
      navigate("/customer");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const meta = customer?.metadata || {};
  const addr = meta.address || meta.deliveryAddress || meta.addressJson || {};
  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt) ? "—" : dt.toISOString().substring(0, 10);
  };

  const title = isView ? "View Customer" : isEdit ? "Edit Customer" : "Customer";

  return (
    <div>
      {loading ? (
        <p className="text-secondary-light">Loading customer...</p>
      ) : loadError ? (
        <div className="alert alert-danger radius-12">{loadError}</div>
      ) : customer ? (
        <>
          {/* ── Header ── */}
          <div className="d-flex align-items-center gap-12 mb-24">
            <button type="button" className="btn btn-primary radius-8 px-12 py-8" onClick={() => navigate(-1)}>
              <Icon icon="mdi:arrow-left" className="text-xl text-white" />
            </button>
            <h3 className="fw-bold mb-0">{title}</h3>
          </div>

          {/* ── Basic Info (read-only) ── */}
          <div className="card radius-12 p-24 mb-20">
            <div className="row">
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Name</label>
                <input type="text" className="form-control radius-8 bg-neutral-100" value={customer.fullName || "—"} disabled />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Mobile Number</label>
                <input type="text" className="form-control radius-8 bg-neutral-100" value={customer.phone || "—"} disabled />
              </div>
            </div>
          </div>

          {/* ── Address Section ── */}
          <div className="card radius-12 p-24 mb-20">
            <div className="row">
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Building Number</label>
                <input type="text" className="form-control radius-8" value={addr.buildingNumber || addr.building || ""} disabled={isView} readOnly={isView} />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Address</label>
                <input type="text" className="form-control radius-8" value={addr.address || addr.line1 || addr.street || ""} disabled={isView} readOnly={isView} />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Address option</label>
                <input type="text" className="form-control radius-8" value={addr.addressOption || addr.line2 || ""} disabled={isView} readOnly={isView} />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Latitude</label>
                <input type="text" className="form-control radius-8" value={addr.latitude || ""} disabled={isView} readOnly={isView} />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Longitude</label>
                <input type="text" className="form-control radius-8" value={addr.longitude || ""} disabled={isView} readOnly={isView} />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Primary Address</label>
                <input type="text" className="form-control radius-8" value={addr.primaryAddress || addr.primary || ""} disabled={isView} readOnly={isView} />
              </div>
            </div>
          </div>

          {/* ── Account Info ── */}
          <div className="card radius-12 p-24 mb-20">
            <div className="row">
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Status</label>
                {isEdit ? (
                  <input type="text" className="form-control radius-8" value={editStatus} onChange={(e) => setEditStatus(e.target.value)} disabled={submitting} />
                ) : (
                  <input type="text" className="form-control radius-8 bg-neutral-100" value={(customer.status || "—").toUpperCase()} disabled />
                )}
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Coupons</label>
                <input type="text" className="form-control radius-8 bg-neutral-100" value={meta.coupons || meta.couponCount || ""} disabled />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Email</label>
                <input type="text" className="form-control radius-8 bg-neutral-100" value={customer.email || ""} disabled />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Date of Join</label>
                <input type="text" className="form-control radius-8 bg-neutral-100" value={formatDate(customer.createdAt)} disabled />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Wallet</label>
                <input type="text" className="form-control radius-8 bg-neutral-100" value={meta.wallet ?? meta.walletBalance ?? 0} disabled />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Referral Code</label>
                <input type="text" className="form-control radius-8 bg-neutral-100" value={meta.referralCode || "—"} disabled />
              </div>
              <div className="col-md-6 mb-16">
                <label className="form-label fw-semibold text-primary-light text-sm mb-8">Applied Referral Code</label>
                <input type="text" className="form-control radius-8 bg-neutral-100" value={meta.appliedReferralCode || ""} disabled />
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          {isEdit && (
            <form onSubmit={onSubmit}>
              <div className="d-flex justify-content-end gap-12">
                <button type="button" onClick={() => navigate(-1)} className="btn border border-danger-600 text-danger-600 radius-8 px-40 py-8">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary radius-8 px-40 py-8">{submitting ? "Saving..." : "Update"}</button>
              </div>
            </form>
          )}
        </>
      ) : null}
    </div>
  );
};

export default CustomerFormLayer;
