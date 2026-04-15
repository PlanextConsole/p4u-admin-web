import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { deleteCustomer, listCustomers, listOccupations } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";
import CustomerFormLayer from "./CustomerFormLayer";

const STATUS_OPTIONS = ["All", "active", "inactive", "suspended"];

const CustomerListLayer = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [occupationMap, setOccupationMap] = useState({});
  const [modal, setModal] = useState(null);

  useEffect(() => {
    listOccupations({ purpose: "all" }).then((res) => {
      const om = {};
      (res.items || []).forEach((o) => { om[o.id] = o.name; });
      setOccupationMap(om);
    }).catch(() => {});
  }, []);

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

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await deleteCustomer(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const filtered = customers.filter((c) => {
    if (statusFilter !== "All" && (c.status || "").toLowerCase() !== statusFilter) return false;
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (new Date(c.createdAt) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(c.createdAt) > to) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (c.fullName || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt)) return "—";
    return dt.toISOString().replace("T", " ").substring(0, 19);
  };

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + customers.length;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3">
        <button className="btn btn-primary text-sm btn-sm px-16 py-8 radius-8">Export with Excel</button>
        <select className="form-select form-select-sm w-auto radius-8 h-40-px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
        </select>
        <input type="date" className="form-control radius-8 h-40-px" style={{ maxWidth: 160 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" className="form-control radius-8 h-40-px" style={{ maxWidth: 160 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <input type="text" className="form-control radius-8 h-40-px ms-auto" style={{ maxWidth: 220 }} placeholder="Search Customers" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card-body p-24">
        {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading customers...</p>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th scope="col">S.No</th>
                    <th scope="col">Name</th>
                    <th scope="col">Mobile Number</th>
                    <th scope="col">Join Date</th>
                    <th scope="col" className="text-center">Status</th>
                    <th scope="col">Occupation</th>
                    <th scope="col">Wallet</th>
                    <th scope="col">Referral Code</th>
                    <th scope="col">Applied Referral Code</th>
                    <th scope="col" className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((customer, index) => {
                      const meta = customer.metadata || {};
                      return (
                        <tr key={customer.id}>
                          <td>{offset + index + 1}</td>
                          <td><span className="text-md fw-normal text-secondary-light">{customer.fullName || "—"}</span></td>
                          <td>{customer.phone || "—"}</td>
                          <td>{formatDate(customer.createdAt)}</td>
                          <td className="text-center">
                            <span className={`px-12 py-4 radius-4 fw-medium text-sm ${String(customer.status).toLowerCase() === "active" ? "bg-success-600 text-white" : "bg-danger-600 text-white"}`}>
                              {(customer.status || "—").toUpperCase()}
                            </span>
                          </td>
                          <td>{occupationMap[customer.occupationId] || meta.occupation || "—"}</td>
                          <td>&#8377; {meta.wallet ?? meta.walletBalance ?? 0}</td>
                          <td>{meta.referralCode || "—"}</td>
                          <td>{meta.appliedReferralCode || "N.A"}</td>
                          <td className="text-center">
                            <div className="d-flex align-items-center gap-10 justify-content-center">
                              <button type="button" onClick={() => setModal({ mode: "view", id: customer.id })} className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="View">
                                <Icon icon="mdi:information-outline" className="icon text-xl" />
                              </button>
                              <button type="button" onClick={() => setModal({ mode: "edit", id: customer.id })} className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="Edit">
                                <Icon icon="lucide:edit" className="menu-icon" />
                              </button>
                              <button type="button" onClick={() => handleDelete(customer.id)} className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="Delete">
                                <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="10" className="text-center py-4">No customers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
              <span>Showing {pageFrom} to {pageTo} of {total} entries</span>
              <div className="d-flex gap-2 align-items-center">
                <button type="button" className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md" disabled={!canPrev} onClick={() => setOffset(Math.max(0, offset - limit))}>
                  <Icon icon="ep:d-arrow-left" />
                </button>
                <span className="page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md bg-primary-600 text-white mb-0">{Math.floor(offset / limit) + 1}</span>
                <button type="button" className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md" disabled={!canNext} onClick={() => setOffset(offset + limit)}>
                  <Icon icon="ep:d-arrow-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="xl">
          <div className="px-20 py-16 pt-48">
            <CustomerFormLayer
              isEdit={modal.mode === "edit"}
              isView={modal.mode === "view"}
              customerId={modal.id}
              onSuccess={() => { setModal(null); load(); }}
              onCancel={() => setModal(null)}
            />
          </div>
        </FormModal>
      )}
    </div>
  );
};

export default CustomerListLayer;
