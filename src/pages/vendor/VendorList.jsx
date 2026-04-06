import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { deleteVendor, listVendors } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import {
  categorySlugToLabel,
  formatDateTime,
  normalizeVendorCategories,
} from "../../lib/formatters";

const VendorListLayer = () => {
  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listVendors({ limit, offset });
      setVendors(res.items || []);
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await deleteVendor(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const kycLabel = (kyc) => (kyc === "verified" ? "Verified" : String(kyc || "—"));
  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + vendors.length;
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
        <Link
          to="/add-vendor"
          className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
        >
          <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
          Add Vendor
        </Link>
      </div>
      <div className="card-body p-24">
        {error && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading vendors…</p>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th scope="col">S.No</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Business Name</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Categories</th>
                    <th scope="col">KYC</th>
                    <th scope="col">Joined</th>
                    <th scope="col" className="text-center">
                      Status
                    </th>
                    <th scope="col" className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length > 0 ? (
                    vendors.map((vendor, index) => {
                      const categorySlugs = normalizeVendorCategories(vendor.categoriesJson);
                      return (
                      <tr key={vendor.id}>
                        <td>{offset + index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            {vendor.logoUrl ? (
                              <img
                                src={vendor.logoUrl}
                                alt=""
                                className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden"
                                style={{ objectFit: "cover" }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextElementSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <span
                              className="w-40-px h-40-px rounded-circle flex-shrink-0 me-12 fw-semibold text-white"
                              style={{
                                display: vendor.logoUrl ? "none" : "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                background: `hsl(${((vendor.ownerName || "V").charCodeAt(0) * 37) % 360}, 55%, 50%)`,
                              }}
                            >
                              {(vendor.ownerName || "V")
                                .split(" ")
                                .filter(Boolean)
                                .map((w) => w[0].toUpperCase())
                                .slice(0, 2)
                                .join("")}
                            </span>
                            <span className="text-md mb-0 fw-normal text-secondary-light">
                              {vendor.ownerName || "—"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="text-md mb-0 fw-normal text-secondary-light">
                            {vendor.businessName || "—"}
                          </span>
                        </td>
                        <td>{vendor.phone || "—"}</td>
                        <td>
                          {categorySlugs.length === 0 ? (
                            <span className="text-secondary-light">—</span>
                          ) : (
                            <div className="d-flex flex-wrap gap-1">
                              {categorySlugs.map((slug, i) => (
                                <span
                                  key={`${slug}-${i}`}
                                  className="bg-neutral-200 text-secondary-light px-8 py-2 radius-4 text-xs fw-medium"
                                >
                                  {categorySlugToLabel(slug)}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>{kycLabel(vendor.kycStatus)}</td>
                        <td>{formatDateTime(vendor.createdAt)}</td>
                        <td className="text-center">
                          <span className="bg-success-focus text-success-600 border border-success-main px-24 py-4 radius-4 fw-medium text-sm">
                            {vendor.status || "—"}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center gap-10 justify-content-center">
                            <Link
                              to={`/view-vendor/${vendor.id}`}
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                              title="View"
                            >
                              <Icon icon="majesticons:eye-line" className="icon text-xl" />
                            </Link>
                            <Link
                              to={`/edit-vendor/${vendor.id}`}
                              className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                              title="Edit"
                            >
                              <Icon icon="lucide:edit" className="menu-icon" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(vendor.id)}
                              className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0"
                              title="Delete"
                            >
                              <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        No vendors found.
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

export default VendorListLayer;
