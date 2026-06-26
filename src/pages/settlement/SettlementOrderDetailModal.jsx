import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { getOrder } from "../../lib/api/adminApi";

function parseMeta(m) {
  if (m == null) return {};
  if (typeof m === "string") {
    try { return JSON.parse(m) || {}; } catch { return {}; }
  }
  return typeof m === "object" && !Array.isArray(m) ? m : {};
}

function statusPill(status) {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "delivered") return { cls: "bg-success-100 text-success-700", label: "Completed" };
  if (s === "cancelled" || s === "canceled") return { cls: "bg-danger-100 text-danger-700", label: "Cancelled" };
  return { cls: "bg-info-100 text-info-700", label: (status || "—").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
}

function formatMoney(n) {
  const x = Number(n) || 0;
  return `₹${x.toLocaleString("en-IN", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

const SettlementOrderDetailModal = ({ orderId, customerName, vendorName, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setLoading(true);
    getOrder(orderId)
      .then((row) => { if (!cancelled) setOrder(row); })
      .catch(() => { if (!cancelled) setOrder(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  const meta = useMemo(() => parseMeta(order?.metadata), [order]);
  const items = useMemo(() => {
    const r = meta.lines ?? meta.items ?? meta.lineItems ?? meta.orderItems;
    return Array.isArray(r) ? r : [];
  }, [meta]);

  const pill = statusPill(order?.status);
  const orderRef = order?.orderRef || order?.id || "—";
  const subtotal = Number(meta.subtotal ?? meta.itemMrp ?? 0) || 0;
  const discount = Number(meta.totalDiscount ?? meta.discount ?? 0) || 0;
  const platformFee = Number(meta.platformFee ?? 0) || 0;
  const tax = Number(meta.taxOnProduct ?? meta.taxAmount ?? meta.tax ?? 0) || 0;
  const total = Number(order?.totalAmount ?? meta.totalOrderValue ?? 0) || 0;
  const points = Number(meta.pointsRedeemed ?? meta.points ?? meta.pointsUsed ?? 0) || 0;
  const cust = customerName || meta.customerName || meta.customer_name || "—";
  const vendor = vendorName || "—";

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-16"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="bg-white radius-12 shadow-lg w-100"
        style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-24">
          <div className="d-flex align-items-center justify-content-between mb-20">
            <div className="d-flex align-items-center gap-10">
              <span className="w-40-px h-40-px radius-8 d-flex align-items-center justify-content-center bg-success-100 text-success-600">
                <Icon icon="mdi:package-variant-closed" className="text-xl" />
              </span>
              <h5 className="fw-bold mb-0">Order Details</h5>
            </div>
            <button
              type="button"
              className="border-0 bg-neutral-100 w-36-px h-36-px radius-circle d-flex align-items-center justify-content-center text-secondary-light"
              aria-label="Close"
              onClick={onClose}
            >
              <Icon icon="mdi:close" className="text-xl" />
            </button>
          </div>

          {loading ? (
            <p className="text-secondary-light mb-0">Loading order…</p>
          ) : !order ? (
            <p className="text-secondary-light mb-0">Order not found.</p>
          ) : (
            <>
              <div className="row g-16 mb-20">
                <div className="col-sm-6">
                  <DetailRow label="Order ID" value={orderRef} />
                  <DetailRow label="Customer" value={cust} />
                  <DetailRow label="Subtotal" value={formatMoney(subtotal)} />
                  <DetailRow label="Discount" value={formatMoney(discount)} />
                  <DetailRow label="Platform Fee" value={formatMoney(platformFee)} />
                </div>
                <div className="col-sm-6">
                  <div className="mb-12">
                    <div className="text-secondary-light text-sm mb-4">Status</div>
                    <span className={`px-12 py-4 radius-pill text-xs fw-medium ${pill.cls}`}>{pill.label}</span>
                  </div>
                  <DetailRow label="Vendor" value={vendor} />
                  <DetailRow label="Tax" value={formatMoney(tax)} />
                  <DetailRow label="Total" value={formatMoney(total)} valueClass="fw-semibold" />
                  <DetailRow label="Points Used" value={String(points)} />
                </div>
              </div>

              <h6 className="fw-semibold mb-12">Line Items</h6>
              <div className="d-flex flex-column gap-12 mb-16">
                {items.length === 0 ? (
                  <div className="border radius-8 p-16 text-secondary-light text-sm">No line items.</div>
                ) : (
                  items.map((row, i) => {
                    const name = row.name || row.productName || row.title || "—";
                    const qty = row.quantity || row.qty || 1;
                    const unit = Number(row.unitPrice || row.price || 0) || 0;
                    const lineTotal = Number(row.lineTotal || row.total || row.finalPrice || unit * qty) || 0;
                    const lineRef = row.lineRef || row.lineItemRef || `${orderRef}-${i + 1}`;
                    return (
                      <div key={i} className="border radius-8 p-12 d-flex align-items-center justify-content-between gap-12">
                        <div className="d-flex align-items-center gap-12 min-w-0">
                          <div className="bg-neutral-100 radius-8 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                            <Icon icon="mdi:image-outline" className="text-2xl text-secondary-light" />
                          </div>
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{name}</div>
                            <div className="text-secondary-light text-sm">
                              Qty: {qty} × {formatMoney(unit)}{" "}
                              <span className="text-xs">({lineRef})</span>
                            </div>
                          </div>
                        </div>
                        <span className="fw-semibold flex-shrink-0">{formatMoney(lineTotal)}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <p className="text-secondary-light text-xs mb-0">
                Note: If items are from different vendors, each vendor gets a separate settlement with line item reference (OrderID-LineNo).
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function DetailRow({ label, value, valueClass = "" }) {
  return (
    <div className="mb-12">
      <div className="text-secondary-light text-sm mb-4">{label}</div>
      <div className={`text-primary-light ${valueClass}`}>{value}</div>
    </div>
  );
}

export default SettlementOrderDetailModal;
