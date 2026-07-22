import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { deleteCoupon, listCoupons } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime, shortJson } from "../../lib/formatters";
import FormModal from "../../components/admin/FormModal";
import CouponFormLayer from "./CouponFormLayer";

export default function CouponListLayer() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCoupons({ limit, offset });
      setItems(res.items || []);
      setTotal(typeof res.total === "number" ? res.total : 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete(id) {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await deleteCoupon(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      String(row.code || "").toLowerCase().includes(q)
      || String(row.title || "").toLowerCase().includes(q)
      || String(row.status || "").toLowerCase().includes(q));
  }, [items, search]);

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + items.length;
  const activeCount = items.filter((r) => String(r.status || "").toLowerCase() === "active").length;

  return (
    <div className="p4u-vendors-page">
      <div className="p4u-vendors-hero">
        <div>
          <h3>Coupons</h3>
          <p>{total.toLocaleString("en-IN")} coupons · Discounts and promotions</p>
        </div>
      </div>

      <div className="p4u-vendors-stats">
        <div className="p4u-vendors-stat is-total">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:ticket-percent-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Total Coupons</p>
            <p className="p4u-vendors-stat__value">{total}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-verified">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:check-circle-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Active (page)</p>
            <p className="p4u-vendors-stat__value">{activeCount}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-pending">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:eye-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Showing</p>
            <p className="p4u-vendors-stat__value">{filtered.length}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-rejected">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:format-list-bulleted" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Page size</p>
            <p className="p4u-vendors-stat__value">{limit}</p>
          </div>
        </div>
      </div>

      <div className="p4u-vendors-toolbar">
        <label className="p4u-vendors-search">
          <Icon icon="mdi:magnify" />
          <input
            type="search"
            placeholder="Search coupons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          className="form-select"
          style={{ maxWidth: 120, height: 42, borderRadius: 12 }}
          value={String(limit)}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setOffset(0);
          }}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
        <div className="p4u-vendors-toolbar__actions">
          <button type="button" className="p4u-vendors-btn-primary" onClick={() => setModal({ mode: "add" })}>
            <Icon icon="ic:baseline-plus" />
            Add Coupon
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      <div className="p4u-vendors-table-wrap">
        {loading ? (
          <p className="text-secondary-light mb-0 p-24">Loading coupons...</p>
        ) : (
          <>
            <table className="p4u-vendors-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Discount</th>
                  <th>Valid From</th>
                  <th>Valid To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">No coupons found.</td>
                  </tr>
                ) : (
                  filtered.map((row, index) => (
                    <tr key={row.id}>
                      <td>{offset + index + 1}</td>
                      <td className="business-name">{row.code || "—"}</td>
                      <td>{row.title || "—"}</td>
                      <td>
                        <span className={`p4u-vendor-pill ${String(row.status || "").toLowerCase() === "active" ? "is-verified" : "is-pending"}`}>
                          {row.status || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="business-owner">{shortJson(row.discountJson)}</span>
                      </td>
                      <td>{formatDateTime(row.validFrom)}</td>
                      <td>{formatDateTime(row.validTo)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-8">
                          <button type="button" className="p4u-vendors-view-btn" title="View" onClick={() => setModal({ mode: "view", id: row.id })}>
                            <Icon icon="mdi:eye-outline" />
                          </button>
                          <button type="button" className="p4u-vendors-view-btn" title="Edit" onClick={() => setModal({ mode: "edit", id: row.id })}>
                            <Icon icon="mdi:pencil-outline" />
                          </button>
                          <button type="button" className="p4u-vendors-view-btn" title="Delete" style={{ color: "#dc2626" }} onClick={() => onDelete(row.id)}>
                            <Icon icon="mdi:trash-can-outline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="p4u-vendors-toolbar" style={{ marginTop: 16, marginBottom: 0 }}>
              <span className="text-secondary-light text-sm">
                Showing {pageFrom} to {pageTo} of {total}
              </span>
              <div className="p4u-vendors-toolbar__actions">
                <button
                  type="button"
                  className="p4u-vendors-btn-outline"
                  disabled={offset <= 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="p4u-vendors-btn-outline"
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(offset + limit)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="lg">
          <CouponFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            couponId={modal.id}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
}
