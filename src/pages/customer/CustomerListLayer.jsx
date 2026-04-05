import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { deleteCustomer, listCustomers } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";

const CustomerListLayer = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCustomers({ limit, offset });
      setCustomers(res.items || []);
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
    if (!window.confirm("Delete this customer?")) return;
    try {
      await deleteCustomer(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + customers.length;
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
          to="/add-customer"
          className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
        >
          <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
          Add Customer
        </Link>
      </div>
      <div className="card-body p-24">
        {error && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading customers…</p>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th scope="col">S.No</th>
                    <th scope="col">Name</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Email</th>
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
                  {customers.length > 0 ? (
                    customers.map((customer, index) => (
                      <tr key={customer.id}>
                        <td>{offset + index + 1}</td>
                        <td>
                          <span className="text-md mb-0 fw-normal text-secondary-light">
                            {customer.fullName || "—"}
                          </span>
                        </td>
                        <td>{customer.phone || "—"}</td>
                        <td>{customer.email || "—"}</td>
                        <td>{formatDateTime(customer.createdAt)}</td>
                        <td className="text-center">
                          <span
                            className={`px-12 py-4 radius-4 fw-medium text-sm ${
                              String(customer.status).toLowerCase() === "active"
                                ? "bg-success-focus text-success-600 border border-success-main"
                                : "bg-danger-focus text-danger-600 border border-danger-main"
                            }`}
                          >
                            {customer.status || "—"}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center gap-10 justify-content-center">
                            <Link
                              to={`/view-customer/${customer.id}`}
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                              title="View"
                            >
                              <Icon icon="majesticons:eye-line" className="icon text-xl" />
                            </Link>
                            <Link
                              to={`/edit-customer/${customer.id}`}
                              className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle"
                              title="Edit"
                            >
                              <Icon icon="lucide:edit" className="menu-icon" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(customer.id)}
                              className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0"
                              title="Delete"
                            >
                              <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No customers found.
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

export default CustomerListLayer;
