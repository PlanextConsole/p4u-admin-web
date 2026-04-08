import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getOrder, updateOrder, getVendor, getCustomer, getProduct, getCategory } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

/** Stable fallback so useMemo / effects are not invalidated every render when metadata is missing */
const EMPTY_ORDER_META = {};

function lineItems(meta) {
  if (!meta || typeof meta !== "object") return [];
  const r = meta.lines ?? meta.items ?? meta.lineItems ?? meta.orderItems;
  return Array.isArray(r) ? r : [];
}

function lineNestedMeta(row) {
  const m = row?.metadata;
  return m && typeof m === "object" ? m : {};
}

/** Cart/checkout snapshots store productName under line.metadata, not top-level. */
function lineItemName(row, productById) {
  const nest = lineNestedMeta(row);
  const pid = row?.productId;
  const fromCatalog = pid && productById[pid]?.name;
  return row?.name || row?.productName || row?.title || nest.productName || fromCatalog || "—";
}

function lineItemCategory(row, productById) {
  const nest = lineNestedMeta(row);
  const pid = row?.productId;
  const fromCatalog = pid && productById[pid]?.categoryName;
  return row?.category || row?.categoryName || nest.categoryName || fromCatalog || "N/A";
}

function vendorCommissionPercent(vendor) {
  if (!vendor || typeof vendor !== "object") return null;
  const raw = vendor.commissionRate ?? vendor.commission_rate;
  if (raw === null || raw === undefined || raw === "") return null;
  return String(raw).replace(/%$/, "");
}

const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours() % 12 || 12).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  const ampm = dt.getHours() >= 12 ? "pm" : "am";
  return `${dd}/${mm}/${yyyy}, ${hh}:${min} ${ampm}`;
};

const OrderFormLayer = ({ isEdit = false, isView = false, orderId }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [customerRow, setCustomerRow] = useState(null);
  /** @type {Record<string, { name?: string, categoryName?: string, discountAmount?: string }>} */
  const [productById, setProductById] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const apply = useCallback((row) => {
    setOrder(row);
    setStatus(row.status || "");
    setCustomerRow(null);
    setProductById({});
    if (row.vendorId) {
      getVendor(row.vendorId).then(setVendor).catch(() => setVendor(null));
    } else {
      setVendor(null);
    }
  }, []);

  useEffect(() => {
    if (!orderId) { setLoading(false); setLoadError("Missing order id."); return; }
    let c = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const row = await getOrder(orderId);
        if (!c) apply(row);
      } catch (e) {
        if (!c) { const msg = e instanceof ApiError ? e.message : String(e); setLoadError(msg); toast.error(msg); }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => { c = true; };
  }, [orderId, apply]);

  useEffect(() => {
    const cid = order?.customerId;
    if (!cid) {
      setCustomerRow(null);
      return;
    }
    let cancelled = false;
    getCustomer(cid)
      .then((row) => {
        if (!cancelled) setCustomerRow(row);
      })
      .catch(() => {
        if (!cancelled) setCustomerRow(null);
      });
    return () => {
      cancelled = true;
    };
  }, [order?.customerId]);

  const meta =
    order?.metadata && typeof order.metadata === "object" ? order.metadata : EMPTY_ORDER_META;
  const items = useMemo(() => lineItems(meta), [meta]);

  useEffect(() => {
    if (!order || !items.length) {
      setProductById({});
      return;
    }
    const ids = [...new Set(items.map((l) => l.productId).filter(Boolean))];
    if (!ids.length) {
      setProductById({});
      return;
    }
    let cancelled = false;
    (async () => {
      /** @type {Record<string, { name?: string, categoryName?: string, discountAmount?: string }>} */
      const next = {};
      for (const pid of ids) {
        try {
          const p = await getProduct(pid);
          if (!p || cancelled) continue;
          let categoryName;
          if (p.categoryId) {
            try {
              const c = await getCategory(p.categoryId);
              categoryName = c?.name;
            } catch {
              categoryName = undefined;
            }
          }
          next[pid] = {
            name: p.name,
            categoryName,
            discountAmount: p.discountAmount != null ? String(p.discountAmount) : undefined,
          };
        } catch {
          /* product deleted or wrong env */
        }
      }
      if (!cancelled) setProductById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [order?.id, items]);
  const addr = meta.deliveryAddress ?? meta.address ?? meta.shippingAddress;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isView || !orderId) return;
    setSubmitting(true);
    try {
      const updated = await updateOrder(orderId, { status: status.trim() || undefined });
      apply(updated);
      toast.success("Order updated.");
      navigate("/orders");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderId) {
    return <div className="card p-24"><div className="alert alert-danger radius-12 mb-0">This order could not be opened.</div></div>;
  }

  return (
    <div>
      {loading ? (
        <p className="text-secondary-light">Loading order...</p>
      ) : loadError ? (
        <div className="alert alert-danger radius-12">{loadError}</div>
      ) : order ? (
        <>
          {/* ── Header ── */}
          <div className="d-flex align-items-center gap-12 mb-24">
            <button type="button" className="btn btn-outline-secondary radius-8 px-12 py-8" onClick={() => navigate(-1)}>
              <Icon icon="mdi:arrow-left" className="text-xl" />
            </button>
            <div>
              <h3 className="fw-bold mb-0">{order.orderRef || order.id}</h3>
              <span className="text-secondary-light text-sm">
                {meta.source === "cart" ? "Shop order (from cart)" : "Order"}
              </span>
            </div>
          </div>

          {/* ── Customer & Vendor Info ── */}
          <div className="row mb-24">
            <div className="col-md-6 mb-16">
              <div className="card radius-12 p-24 h-100">
                <div className="d-flex align-items-center gap-8 mb-16">
                  <Icon icon="mdi:account-outline" className="text-2xl text-secondary-light" />
                  <h5 className="fw-semibold mb-0">Customer Information</h5>
                </div>
                <div className="mb-8">
                  <span className="text-secondary-light text-sm">Name</span>
                  <p className="fw-semibold mb-0">
                    {meta.customerName ||
                      meta.customer_name ||
                      customerRow?.fullName ||
                      customerRow?.full_name ||
                      "—"}
                  </p>
                </div>
                <div className="mb-8">
                  <span className="text-secondary-light text-sm d-flex align-items-center gap-4"><Icon icon="mdi:cellphone" /> Mobile</span>
                  <p className="fw-semibold mb-0">
                    {meta.customerPhone ||
                      meta.customer_phone ||
                      customerRow?.phone ||
                      "—"}
                  </p>
                </div>
                <div className="mb-8">
                  <span className="text-secondary-light text-sm d-flex align-items-center gap-4"><Icon icon="mdi:email-outline" /> Email</span>
                  <p className="fw-semibold mb-0">
                    {meta.customerEmail ||
                      meta.customer_email ||
                      customerRow?.email ||
                      "—"}
                  </p>
                </div>
                {addr && typeof addr === "object" && (
                  <div>
                    <span className="text-secondary-light text-sm d-flex align-items-center gap-4"><Icon icon="mdi:map-marker" /> Address</span>
                    <p className="fw-semibold mb-0">{Object.values(addr).filter(Boolean).join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6 mb-16">
              <div className="card radius-12 p-24 h-100">
                <div className="d-flex align-items-center gap-8 mb-16">
                  <Icon icon="mdi:office-building-outline" className="text-2xl text-secondary-light" />
                  <h5 className="fw-semibold mb-0">Vendor Information</h5>
                </div>
                <div className="mb-8">
                  <span className="text-secondary-light text-sm">Business Name</span>
                  <p className="fw-semibold mb-0">{vendor?.businessName || "—"}</p>
                </div>
                <div className="mb-8">
                  <span className="text-secondary-light text-sm d-flex align-items-center gap-4"><Icon icon="mdi:check-decagram" /> Vendor Status</span>
                  <p className="fw-semibold mb-0">{vendor?.status || "Loading..."}</p>
                </div>
                <div>
                  <span className="text-secondary-light text-sm d-flex align-items-center gap-4"><Icon icon="mdi:chart-bar" /> Commission Rate</span>
                  <p className="fw-semibold mb-0">
                    {(() => {
                      const pct = vendorCommissionPercent(vendor);
                      return pct != null ? `${pct}%` : "—";
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Ordered Items ── */}
          {items.length > 0 && (
            <div className="card radius-12 p-24 mb-24">
              <div className="d-flex align-items-center gap-8 mb-16">
                <Icon icon="mdi:package-variant-closed" className="text-2xl text-warning-600" />
                <h5 className="fw-semibold mb-0">Ordered Items</h5>
              </div>
              <div className="table-responsive">
                <table className="table bordered-table sm-table mb-0">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th>ITEM / SERVICE NAME</th>
                      <th>CATEGORY</th>
                      <th>QTY</th>
                      <th>UNIT PRICE</th>
                      <th>TAX RATE</th>
                      <th>TAX AMOUNT</th>
                      <th>DISCOUNT</th>
                      <th>ITEM FINAL PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, i) => {
                      const pid = row.productId;
                      const nest = lineNestedMeta(row);
                      const disc =
                        row.discount ??
                        nest.discount ??
                        (pid && productById[pid]?.discountAmount);
                      return (
                      <tr key={i}>
                        <td>{lineItemName(row, productById)}</td>
                        <td>{lineItemCategory(row, productById)}</td>
                        <td>{row.quantity || row.qty || 1}</td>
                        <td>₹{row.unitPrice || row.price || 0}<br /><span className="text-xs text-secondary-light">MRP</span></td>
                        <td>{row.taxRate != null && row.taxRate !== "" ? row.taxRate : "—"}</td>
                        <td>{row.taxAmount != null && row.taxAmount !== "" ? `₹${row.taxAmount}` : "—"}</td>
                        <td className="text-danger-600">
                          {disc != null && disc !== "" && Number(disc) !== 0 ? `-₹${disc}` : "—"}
                        </td>
                        <td>₹{row.lineTotal || row.total || row.finalPrice || 0}<br /><span className="text-xs text-secondary-light">× {row.quantity || row.qty || 1}</span></td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pricing Summary ── */}
          <div className="card radius-12 p-24 mb-24">
            <div className="d-flex align-items-center gap-8 mb-16">
              <span className="bg-primary-600 text-white w-32-px h-32-px d-flex align-items-center justify-content-center radius-8"><Icon icon="mdi:currency-inr" /></span>
              <h5 className="fw-semibold mb-0">Pricing Summary</h5>
            </div>
            {[
              { label: "Subtotal (Item MRP)", value: `₹${meta.subtotal || meta.itemMrp || order.totalAmount || 0}` },
              { label: "Total Discount", value: meta.totalDiscount || meta.discount ? `-₹${meta.totalDiscount || meta.discount}` : "₹0", cls: "text-danger-600" },
              { label: "Item Final Price", value: `₹${meta.itemFinalPrice || meta.finalPrice || 0}` },
              { label: "Platform Fee", value: `₹${meta.platformFee || 0}` },
              { label: `GST on Platform Fee (18%)`, value: `₹${meta.gstOnPlatformFee || 0}` },
              { label: "Tax on Product", value: `₹${meta.taxOnProduct || meta.taxAmount || 0}` },
              { label: "P4U Commission", value: `₹${meta.p4uCommission || 0}` },
              { label: "Net Vendor Payable", value: `₹${meta.netVendorPayable || 0}`, cls: "text-success-600" },
            ].map((r, i) => (
              <div key={i} className="d-flex justify-content-between py-8 border-bottom">
                <span className="text-secondary-light">{r.label}</span>
                <span className={`fw-semibold ${r.cls || ""}`}>{r.value}</span>
              </div>
            ))}
            <div className="d-flex justify-content-between py-12 mt-8 bg-warning-50 radius-8 px-16">
              <span className="fw-bold">Total Order Value</span>
              <span className="fw-bold text-success-600">₹{meta.totalOrderValue || order.totalAmount || 0}</span>
            </div>
          </div>

          {/* ── Order Timeline ── */}
          <div className="card radius-12 p-24 mb-24">
            <h5 className="fw-semibold mb-4">Order &amp; Settlement Timeline</h5>
            <span className="text-secondary-light text-sm mb-16 d-block">Complete lifecycle from order creation to vendor payout</span>
            <div className="d-flex flex-column gap-16">
              <div className="d-flex align-items-start gap-12">
                <div className="w-40-px h-40-px bg-neutral-100 radius-circle d-flex align-items-center justify-content-center flex-shrink-0">
                  <Icon icon="mdi:cart-outline" className="text-xl text-secondary-light" />
                </div>
                <div>
                  <span className="fw-semibold">Order Created</span>
                  <p className="text-secondary-light text-sm mb-0">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              {order.vendorId && (
                <div className="d-flex align-items-start gap-12">
                  <div className="w-40-px h-40-px bg-neutral-100 radius-circle d-flex align-items-center justify-content-center flex-shrink-0">
                    <Icon icon="mdi:account-check-outline" className="text-xl text-secondary-light" />
                  </div>
                  <div>
                    <span className="fw-semibold">Vendor Assigned</span>
                    <p className="text-secondary-light text-sm mb-0">{vendor?.businessName || "—"}</p>
                  </div>
                </div>
              )}
              {(order.status || "").toLowerCase() === "completed" && (
                <div className="d-flex align-items-start gap-12">
                  <div className="w-40-px h-40-px bg-success-100 radius-circle d-flex align-items-center justify-content-center flex-shrink-0">
                    <Icon icon="mdi:check-circle-outline" className="text-xl text-success-600" />
                  </div>
                  <div>
                    <span className="fw-semibold text-success-600">Order Completed</span>
                    <p className="text-secondary-light text-sm mb-0">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Edit Status (edit mode only) ── */}
          {isEdit && (
            <form onSubmit={onSubmit}>
              <div className="card radius-12 p-24 mb-24">
                <h5 className="fw-semibold mb-16">Update Order</h5>
                <div className="row">
                  <div className="col-md-6 mb-16">
                    <label className="form-label text-sm fw-semibold">Status</label>
                    <input className="form-control radius-8" value={status} onChange={(e) => setStatus(e.target.value)} disabled={submitting} maxLength={64} />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-12">
                  <button type="button" onClick={() => navigate(-1)} className="btn border border-danger-600 text-danger-600 radius-8 px-40 py-8">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary radius-8 px-40 py-8">{submitting ? "Saving..." : "Save"}</button>
                </div>
              </div>
            </form>
          )}
        </>
      ) : null}
    </div>
  );
};

export default OrderFormLayer;
