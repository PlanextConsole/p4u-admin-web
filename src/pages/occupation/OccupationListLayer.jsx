import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { deleteOccupation, listOccupations } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";

export default function OccupationListLayer() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listOccupations({ purpose: "all" });
      setItems(res.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete(id) {
    if (!window.confirm("Delete this occupation?")) return;
    try {
      await deleteOccupation(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  }

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span className="text-md fw-medium text-secondary-light mb-0">Occupations</span>
        <Link to="/add-occupation" className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2">
          <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
          Add Occupation
        </Link>
      </div>
      <div className="card-body p-24">
        {error && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading...</p>
        ) : (
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table sm-table mb-0">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Sort</th>
                  <th className="text-center">Active</th>
                  <th>Updated</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No occupations.
                    </td>
                  </tr>
                ) : (
                  items.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td className="fw-semibold">{row.name || "—"}</td>
                      <td>{row.sortOrder ?? 0}</td>
                      <td className="text-center">{row.isActive !== false ? "Yes" : "No"}</td>
                      <td>{formatDateTime(row.updatedAt)}</td>
                      <td>
                        <div className="d-flex gap-10 justify-content-center">
                          <Link
                            to={`/view-occupation/${row.id}`}
                            className="bg-info-focus text-info-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                          >
                            <Icon icon="majesticons:eye-line" className="icon text-xl" />
                          </Link>
                          <Link
                            to={`/edit-occupation/${row.id}`}
                            className="bg-success-focus text-success-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                          >
                            <Icon icon="lucide:edit" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => onDelete(row.id)}
                            className="bg-danger-focus text-danger-600 w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0"
                          >
                            <Icon icon="fluent:delete-24-regular" className="icon text-xl" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
