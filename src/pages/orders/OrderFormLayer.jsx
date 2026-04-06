import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getOrder, updateOrder } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime, formatInrAmount } from "../../lib/formatters";

function stringifyJson(v) {
  if (v == null) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function parseMeta(text) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    throw new Error("Invalid JSON in metadata");
  }
}

function lineItems(meta) {
  if (!meta || typeof meta !== "object") return [];
  const r = meta.lines ?? meta.items ?? meta.lineItems ?? meta.orderItems;
  return Array.isArray(r) ? r : [];
}

function pick(row, keys) {
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]);
  }
  return "—";
}

const OrderFormLayer = ({ isEdit = false, isView = false, orderId }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [metadataText, setMetadataText] = useState("");

  const apply = useCallback((row) => {
    setOrder(row);
    setStatus(row.status || "");
    setOrderRef(row.orderRef || "");
    setTotalAmount(row.totalAmount != null ? String(row.totalAmount) : "");
    setMetadataText(stringifyJson(row.metadata));
  }, []);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setLoadError("Missing order id.");
      return;
    }
    let c = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const row = await getOrder(orderId);
        if (!c) apply(row);
      } catch (e) {
        if (!c) {
          const msg = e instanceof ApiError ? e.message : String(e);
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [orderId, apply]);

  const items = useMemo(() => lineItems(order?.metadata), [order]);
  const addr = useMemo(() => {
    const m = order?.metadata;
    if (!m || typeof m !== "object") return null;
    const a = m.deliveryAddress ?? m.address ?? m.shippingAddress;
    return a && typeof a === "object" && !Array.isArray(a) ? a : null;
  }, [order]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isView || !orderId) return;
    let metadata;
    try {
      metadata = parseMeta(metadataText);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      return;
    }
    setSubmitting(true);
    try {
      const updated = await updateOrder(orderId, {
        status: status.trim() || undefined,
        orderRef: orderRef.trim() ? orderRef.trim() : null,
        totalAmount: totalAmount.trim() || undefined,
        vendorId: order?.vendorId ?? null,
        customerId: order?.customerId ?? null,
        metadata,
      });
      apply(updated);
      toast.success("Order updated.");
      navigate("/orders");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const dis = isView || submitting || loading;
  const title = isView ? "View Order" : isEdit ? "Edit Order" : "Order";

  if (!orderId) {
    return (
      <div className="card h-100 p-0 radius-12">
        <div className="card-body p-24">
          <div className="alert alert-danger radius-12 mb-0" role="alert">
            This order could not be opened. Use the orders list.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h4 className="text-lg fw-semibold mb-0">{title}</h4>
      </div>
      <div className="card-body p-24">
        {loadError && !loading && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">
            {loadError}
          </div>
        )}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading order...</p>
        ) : order ? (
          <form onSubmit={onSubmit}>
            <div className="row mb-24">
              <div className="col-lg-6 mb-16">
                <div className="border radius-8 p-16">
                  <h6 className="text-md fw-semibold mb-12 border-bottom pb-8">Summary</h6>
                  {order.orderRef ? (
                    <div className="d-flex justify-content-between mb-8">
                      <span className="text-secondary-light">Reference</span>
                      <span className="fw-medium">{order.orderRef}</span>
                    </div>
                  ) : null}
                  <div className="d-flex justify-content-between mb-8">
                    <span className="text-secondary-light">Created</span>
                    <span className="fw-medium">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-8">
                    <span className="text-secondary-light">Total</span>
                    <span className="fw-medium">{formatInrAmount(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            {addr && (
              <div className="border radius-8 p-16 mb-24">
                <h6 className="text-md fw-semibold mb-12">Address</h6>
                <div className="row">
                  {Object.entries(addr).map(([k, v]) => (
                    <div key={k} className="col-md-6 mb-8 text-sm">
                      <span className="text-secondary-light">{k}: </span>
                      {v == null ? "—" : String(v)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {items.length > 0 && (
              <div className="table-responsive border radius-8 mb-24">
                <table className="table bordered-table sm-table mb-0">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{pick(row, ["name", "productName", "title", "productId"])}</td>
                        <td>{pick(row, ["quantity", "qty"])}</td>
                        <td>{formatInrAmount(row.lineTotal ?? row.total ?? row.price ?? row.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border radius-8 p-24 mb-24 bg-neutral-50">
              <div className="row">
                <div className="col-md-6 mb-16">
                  <label className="form-label text-sm fw-semibold">Status</label>
                  <input
                    className="form-control radius-8"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={dis}
                    maxLength={64}
                  />
                </div>
                <div className="col-md-6 mb-16">
                  <label className="form-label text-sm fw-semibold">Order ref</label>
                  <input
                    className="form-control radius-8"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    disabled={dis}
                    maxLength={64}
                  />
                </div>
                <div className="col-md-6 mb-16">
                  <label className="form-label text-sm fw-semibold">Total amount</label>
                  <input
                    className="form-control radius-8"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    disabled={dis}
                  />
                </div>
                <div className="col-12 mb-16">
                  <label className="form-label text-sm fw-semibold">Metadata (JSON)</label>
                  <textarea
                    className="form-control radius-8 text-sm font-monospace"
                    rows={10}
                    value={metadataText}
                    onChange={(e) => setMetadataText(e.target.value)}
                    disabled={dis}
                  />
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-between mt-24">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn border border-danger-600 text-danger-600 radius-8 px-40 py-12 d-flex align-items-center gap-2"
              >
                <Icon icon="mdi:close-circle-outline" className="text-xl" /> Back
              </button>
              {!isView && (
                <button
                  type="submit"
                  disabled={dis}
                  className="btn btn-primary radius-8 px-40 py-12 d-flex align-items-center gap-2"
                >
                  <Icon icon="lucide:save" className="text-xl" /> {submitting ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default OrderFormLayer;
