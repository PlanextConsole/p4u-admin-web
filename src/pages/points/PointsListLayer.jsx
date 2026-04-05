import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { listPointsSettlements } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime, formatInrAmount } from "../../lib/formatters";

const PointsListLayer = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listPointsSettlements({ limit, offset });
      setRows(res.items || []);
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

  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "completed" || s === "settled") return "bg-success-focus text-success-600 border border-success-main";
    if (s === "rejected" || s === "failed") return "bg-danger-focus text-danger-600 border border-danger-main";
    return "bg-warning-focus text-warning-600 border border-warning-main";
  };

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + rows.length;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
        <div className="d-flex align-items-center flex-wrap gap-3">
          <span className="text-md fw-medium text-secondary-light mb-0">Show</span>
          <select
            className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
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
        </div>
      </div>
      <div className="card-body p-24">
        {error && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading point settlements…</p>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th scope="col">S.No</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Type</th>
                    <th scope="col" className="text-center">
                      Status
                    </th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((item, index) => (
                      <tr key={item.id}>
                        <td>{offset + index + 1}</td>
                        <td>{formatInrAmount(item.amount)}</td>
                        <td>{item.settlementType || "—"}</td>
                        <td className="text-center">
                          <span className={`px-12 py-4 radius-4 fw-medium text-sm ${getStatusBadge(item.status)}`}>
                            {item.status || "—"}
                          </span>
                        </td>
                        <td>{formatDateTime(item.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No point settlements found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
              <span>
                Showing {pageFrom} to {pageTo} of {total} entries
              </span>
              <div className="d-flex gap-2 align-items-center">
                <button
                  type="button"
                  className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                  disabled={!canPrev}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  <Icon icon="ep:d-arrow-left" />
                </button>
                <span className="page-link text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md bg-primary-600 text-white mb-0">
                  {Math.floor(offset / limit) + 1}
                </span>
                <button
                  type="button"
                  className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                  disabled={!canNext}
                  onClick={() => setOffset(offset + limit)}
                >
                  <Icon icon="ep:d-arrow-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PointsListLayer;
