import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { updateServiceBookingStatus } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const STEPS = ["placed", "paid", "accepted", "in_progress", "shipped", "delivered", "completed"];
const STEP_LABELS = {
  placed: "Placed",
  paid: "Paid",
  accepted: "Accepted",
  in_progress: "In Progress",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
};

/** UI labels map to commerce_bookings status values. */
const STATUS_OPTIONS = [
  { value: "pending", label: "Placed" },
  { value: "approved", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

function parseMeta(m) {
  if (m == null) return {};
  if (typeof m === "string") {
    try { return JSON.parse(m) || {}; } catch { return {}; }
  }
  return typeof m === "object" && !Array.isArray(m) ? m : {};
}

function bookingStepIndex(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending") return 0;
  if (s === "approved") return 2;
  if (s === "in_progress") return 3;
  if (s === "completed") return 5;
  if (s === "cancelled" || s === "rejected") return -1;
  return 0;
}

function statusPill(status) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { cls: "bg-success-100 text-success-700", label: "Delivered" };
  if (s === "cancelled" || s === "rejected") return { cls: "bg-danger-100 text-danger-700", label: "Cancelled" };
  if (s === "approved") return { cls: "bg-info-100 text-info-700", label: "Accepted" };
  if (s === "in_progress") return { cls: "bg-warning-100 text-warning-700", label: "In Progress" };
  if (s === "pending") return { cls: "bg-warning-100 text-warning-700", label: "Placed" };
  return { cls: "bg-info-100 text-info-700", label: (status || "—").replace(/_/g, " ") };
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`;
}

function formatMoney(n) {
  const x = Number(n) || 0;
  return `₹${x.toLocaleString("en-IN", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

const ServiceBookingDetailModal = ({
  booking,
  orderRef,
  customerName,
  customerRef,
  vendorName,
  vendorRef,
  initialMode = "view",
  onClose,
  onSaved,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [status, setStatus] = useState(booking?.status || "pending");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(booking?.status || "pending");
    setMode(initialMode);
  }, [booking, initialMode]);

  const meta = useMemo(() => parseMeta(booking?.metadata), [booking]);
  const pill = statusPill(booking?.status);
  const currentIdx = bookingStepIndex(booking?.status);

  const serviceName = meta.serviceName || booking?.serviceLabel || "Service";
  const qty = 1;
  const lineTotal = Number(booking?.totalAmount ?? meta.totalAmount ?? 0) || 0;
  const itemTotal = Number(meta.subtotal ?? meta.itemMrp ?? lineTotal) || lineTotal;
  const platformFee = Number(meta.platformFee ?? 0) || 0;
  const gstOnFee = Number(meta.gstOnPlatformFee ?? (platformFee ? platformFee * 0.18 : 0)) || 0;
  const paymentRef = meta.paymentRefId || meta.paymentReferenceId || meta.paymentRef || "—";

  const save = async () => {
    if (!booking?.id) return;
    setSaving(true);
    try {
      const res = await updateServiceBookingStatus(booking.id, { status });
      const data = res?.data ?? res;
      toast.success("Booking updated.");
      onSaved && onSaved({ ...booking, status: data?.status ?? status });
      onClose && onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!booking) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-16"
      style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="bg-white radius-12 shadow-lg w-100"
        style={{ maxWidth: 720, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-24">
          <div className="d-flex align-items-start justify-content-between mb-16">
            <div className="d-flex gap-12 align-items-center">
              <span className="bg-success-600 text-white w-48-px h-48-px radius-8 d-flex align-items-center justify-content-center">
                <Icon icon="mdi:cart-outline" className="text-2xl" />
              </span>
              <div>
                <h4 className="fw-bold mb-0">{orderRef || "—"}</h4>
                <span className="text-secondary-light text-sm">{formatDate(booking.createdAt)}</span>
                <div className="mt-4">
                  <span className={`px-12 py-4 radius-pill text-xs fw-medium ${pill.cls}`}>{pill.label}</span>
                </div>
              </div>
            </div>
            <button type="button" className="border-0 bg-transparent p-8 text-secondary-light lh-1" aria-label="Close" onClick={onClose}>
              <Icon icon="mdi:close" className="text-2xl" />
            </button>
          </div>

          <div className="d-flex gap-2 mb-24 mt-16">
            {STEPS.map((s, i) => {
              const done = currentIdx >= 0 && i <= currentIdx;
              return (
                <div key={s} className="flex-fill">
                  <div className={`radius-pill ${done ? "bg-success-600" : "bg-neutral-200"}`} style={{ height: 6 }} />
                  <span className={`text-xs mt-6 d-block ${done ? "text-primary-light fw-semibold" : "text-secondary-light"}`}>{STEP_LABELS[s]}</span>
                </div>
              );
            })}
          </div>

          <div className="row g-12 mb-20">
            <div className="col-6">
              <div className="border radius-8 p-12 d-flex align-items-center gap-8">
                <Icon icon="mdi:account-outline" className="text-2xl text-primary-600" />
                <div>
                  <div className="text-secondary-light text-xs">Customer</div>
                  <div className="fw-semibold">{customerName || "—"}</div>
                  {customerRef && <div className="text-secondary-light text-xs">{customerRef}</div>}
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="border radius-8 p-12 d-flex align-items-center gap-8">
                <Icon icon="mdi:storefront-outline" className="text-2xl text-primary-600" />
                <div>
                  <div className="text-secondary-light text-xs">Vendor</div>
                  <div className="fw-semibold">{vendorName || "—"}{vendorRef ? ` (${vendorRef})` : ""}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-8 mb-12">
            <Icon icon="mdi:package-variant-closed" className="text-xl text-primary-600" />
            <h6 className="fw-semibold mb-0">Order Items</h6>
          </div>
          <div className="border radius-8 p-12 mb-16">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex gap-12 align-items-center">
                <div className="bg-neutral-100 radius-8 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                  <Icon icon="mdi:wrench-outline" className="text-2xl text-secondary-light" />
                </div>
                <div>
                  <div className="fw-semibold">{serviceName}</div>
                  <div className="text-secondary-light text-xs">
                    Qty: {qty}
                    {booking.date ? ` · ${new Date(booking.date).toLocaleDateString()}` : ""}
                    {booking.slot ? ` · ${booking.slot}` : ""}
                  </div>
                </div>
              </div>
              <span className="fw-semibold">{formatMoney(lineTotal)}</span>
            </div>
          </div>

          <div className="border radius-8 p-16 mb-16 bg-info-50">
            <Row label="Item Total (MRP)" value={formatMoney(itemTotal)} />
            <Row label="Platform Fee" value={formatMoney(platformFee)} show={platformFee > 0} />
            <Row label="GST on Platform Fee (18%)" value={formatMoney(gstOnFee)} show={gstOnFee > 0} />
            <div className="d-flex justify-content-between py-12 mt-8 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold">{formatMoney(lineTotal)}</span>
            </div>
            <div className="d-flex justify-content-between mt-8">
              <span className="text-secondary-light">Payment Ref ID</span>
              <span className="text-secondary-light text-sm">{paymentRef}</span>
            </div>
          </div>

          {mode === "edit" && (
            <div className="border border-primary-200 bg-primary-50 radius-8 p-16 mb-16">
              <label className="form-label text-sm fw-semibold">Update Order Status</label>
              <select className="form-select radius-8" value={status} onChange={(e) => setStatus(e.target.value)} disabled={saving}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="d-flex justify-content-end gap-12">
            {mode === "view" ? (
              <>
                <button type="button" className="btn btn-outline-secondary radius-8 px-24 py-8" onClick={onClose}>Close</button>
                <button type="button" className="btn btn-primary radius-8 px-24 py-8" onClick={() => setMode("edit")}>Edit Status</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-outline-secondary radius-8 px-24 py-8" onClick={onClose} disabled={saving}>Cancel</button>
                <button type="button" className="btn btn-primary radius-8 px-24 py-8" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Row({ label, value, show = true }) {
  if (!show) return null;
  return (
    <div className="d-flex justify-content-between py-6">
      <span className="text-secondary-light">{label}</span>
      <span className="fw-medium">{value}</span>
    </div>
  );
}

export default ServiceBookingDetailModal;
