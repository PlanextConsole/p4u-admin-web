import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCustomer, updateCustomer } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const CustomerFormLayer = ({ isEdit = false, isView = false, customerId, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const back = () => (onCancel ? onCancel() : navigate(-1));
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
      if (onSuccess) onSuccess(); else navigate("/customer");
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

  const fieldClass = "form-control form-control-sm radius-8 text-sm";
  const fieldDisabled = `${fieldClass} bg-neutral-100`;
  const labelClass = "form-label fw-medium text-secondary-light mb-6 text-xs text-uppercase";

  return (
    <div className="customer-form-layer">
      {loading ? (
        <p className="text-secondary-light text-sm mb-0">Loading customer...</p>
      ) : loadError ? (
        <div className="alert alert-danger radius-12 py-12 px-16 text-sm">{loadError}</div>
      ) : customer ? (
        <>
          {/* ── Header ── */}
          <div className="d-flex align-items-center gap-10 mb-16">
            <button
              type="button"
              className="btn btn-primary btn-sm radius-8 px-10 py-6 d-inline-flex align-items-center justify-content-center"
              onClick={back}
            >
              <Icon icon="mdi:arrow-left" className="icon text-white" />
            </button>
            <h5 className="fw-semibold mb-0 text-md text-primary-light">{title}</h5>
          </div>

          {/* ── Basic Info (read-only) ── */}
          <div className="card border shadow-none radius-12 p-16 mb-12">
            <div className="row g-2">
              <div className="col-md-6">
                <label className={labelClass}>Name</label>
                <input type="text" className={fieldDisabled} value={customer.fullName || "—"} disabled />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Mobile Number</label>
                <input type="text" className={fieldDisabled} value={customer.phone || "—"} disabled />
              </div>
            </div>
          </div>

          {/* ── Address Section ── */}
          <div className="card border shadow-none radius-12 p-16 mb-12">
            <div className="row g-2">
              <div className="col-md-6">
                <label className={labelClass}>Building Number</label>
                <input
                  type="text"
                  className={isView ? fieldDisabled : fieldClass}
                  value={addr.buildingNumber || addr.building || ""}
                  disabled={isView}
                  readOnly={isView}
                />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  className={isView ? fieldDisabled : fieldClass}
                  value={addr.address || addr.line1 || addr.street || ""}
                  disabled={isView}
                  readOnly={isView}
                />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Address option</label>
                <input
                  type="text"
                  className={isView ? fieldDisabled : fieldClass}
                  value={addr.addressOption || addr.line2 || ""}
                  disabled={isView}
                  readOnly={isView}
                />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Latitude</label>
                <input type="text" className={isView ? fieldDisabled : fieldClass} value={addr.latitude || ""} disabled={isView} readOnly={isView} />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Longitude</label>
                <input type="text" className={isView ? fieldDisabled : fieldClass} value={addr.longitude || ""} disabled={isView} readOnly={isView} />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Primary Address</label>
                <input
                  type="text"
                  className={isView ? fieldDisabled : fieldClass}
                  value={addr.primaryAddress || addr.primary || ""}
                  disabled={isView}
                  readOnly={isView}
                />
              </div>
            </div>
          </div>

          {/* ── Account Info ── */}
          <div className="card border shadow-none radius-12 p-16 mb-12">
            <div className="row g-2">
              <div className="col-md-6">
                <label className={labelClass}>Status</label>
                {isEdit ? (
                  <input type="text" className={fieldClass} value={editStatus} onChange={(e) => setEditStatus(e.target.value)} disabled={submitting} />
                ) : (
                  <input type="text" className={fieldDisabled} value={(customer.status || "—").toUpperCase()} disabled />
                )}
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Coupons</label>
                <input type="text" className={fieldDisabled} value={meta.coupons || meta.couponCount || ""} disabled />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Email</label>
                <input type="text" className={fieldDisabled} value={customer.email || ""} disabled />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Date of Join</label>
                <input type="text" className={fieldDisabled} value={formatDate(customer.createdAt)} disabled />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Wallet</label>
                <input type="text" className={fieldDisabled} value={meta.wallet ?? meta.walletBalance ?? 0} disabled />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Referral Code</label>
                <input type="text" className={fieldDisabled} value={meta.referralCode || "—"} disabled />
              </div>
              <div className="col-md-6">
                <label className={labelClass}>Applied Referral Code</label>
                <input type="text" className={fieldDisabled} value={meta.appliedReferralCode || ""} disabled />
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          {isEdit && (
            <form onSubmit={onSubmit}>
              <div className="d-flex justify-content-end gap-10 pt-4">
                <button type="button" onClick={back} className="btn btn-sm border border-danger-600 text-danger-600 radius-8 px-24 py-6">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm radius-8 px-24 py-6">
                  {submitting ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          )}
        </>
      ) : null}
    </div>
  );
};

export default CustomerFormLayer;
