import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { deleteVendor, listVendors } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { normalizeVendorCategories, categorySlugToLabel } from "../../lib/formatters";
import CountAndChips from "../../components/admin/CountAndChips";
import FormModal from "../../components/admin/FormModal";
import VendorFormLayer from "./VendorFormLayer";

const VendorListLayer = () => {
  const [vendors, setVendors] = useState([]);
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
      const res = await listVendors({ limit, offset, status: "active" });
      setVendors(res.items || []);
      setTotal(typeof res.total === "number" ? res.total : 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await deleteVendor(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const filtered = search.trim()
    ? vendors.filter((v) => {
        const q = search.toLowerCase();
        return (
          (v.ownerName || "").toLowerCase().includes(q) ||
          (v.businessName || "").toLowerCase().includes(q) ||
          (v.phone || "").includes(q) ||
          JSON.stringify(v.categoriesJson || "").toLowerCase().includes(q) ||
          JSON.stringify(v.servicesJson || "").toLowerCase().includes(q)
        );
      })
    : vendors;

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + vendors.length;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const statusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "verified") return "bg-success-600 text-white";
    if (s === "not_verified") return "bg-warning-600 text-white";
    if (s === "suspended" || s === "rejected") return "bg-danger-600 text-white";
    return "bg-neutral-400 text-white";
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt)) return "—";
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
  };

  const normServices = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : x?.name || x?.slug || "")).filter(Boolean);
    return [];
  };

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
        <div className="d-flex align-items-center flex-wrap gap-3">
          <button className="btn btn-primary text-sm btn-sm px-16 py-8 radius-8">Export with Excel</button>
          <button type="button" onClick={() => setModal({ mode: "add" })} className="btn btn-primary text-sm btn-sm px-12 py-8 radius-8 d-flex align-items-center gap-2">
            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" /> Add Vendor
          </button>
        </div>
        <input
          type="text"
          className="form-control radius-8"
          style={{ maxWidth: 320 }}
          placeholder="Search Vendor, category, service, business"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="card-body p-24">
        {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading vendors...</p>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th scope="col">S.No</th>
                    <th scope="col">Name</th>
                    <th scope="col">Business Name</th>
                    <th scope="col">Mobile Number</th>
                    <th scope="col">Categories</th>
                    <th scope="col">Services</th>
                    <th scope="col">Membership</th>
                    <th scope="col">Joining Date</th>
                    <th scope="col" className="text-center">Status</th>
                    <th scope="col" className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((vendor, index) => {
                      const cats = normalizeVendorCategories(vendor.categoriesJson);
                      const svcs = normServices(vendor.servicesJson);
                      return (
                        <tr key={vendor.id}>
                          <td>{offset + index + 1}</td>
                          <td><span className="text-md fw-normal text-secondary-light">{vendor.ownerName || "—"}</span></td>
                          <td><span className="text-md fw-normal text-secondary-light">{vendor.businessName || "—"}</span></td>
                          <td>{vendor.phone || "—"}</td>
                          <td>
                            <CountAndChips
                              strings={cats.map(categorySlugToLabel)}
                              countSuffix="categories"
                            />
                          </td>
                          <td>
                            <CountAndChips strings={svcs} countSuffix="services" />
                          </td>
                          <td>{(vendor.membershipStatus || "STANDARD").toUpperCase()}</td>
                          <td>{formatDate(vendor.createdAt)}</td>
                          <td className="text-center">
                            <span className={`px-16 py-4 radius-4 fw-medium text-sm ${statusBadge(vendor.status)}`}>
                              {(vendor.status || "—").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center gap-10 justify-content-center">
                              <button type="button" onClick={() => setModal({ mode: "view", id: vendor.id })} className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="View">
                                <Icon icon="majesticons:eye-line" className="icon text-xl" />
                              </button>
                              <button type="button" onClick={() => setModal({ mode: "edit", id: vendor.id })} className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="Edit">
                                <Icon icon="lucide:edit" className="menu-icon" />
                              </button>
                              <button type="button" onClick={() => handleDelete(vendor.id)} className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="Delete">
                                <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="10" className="text-center py-4">No vendors found.</td></tr>
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
                <span className="page-link text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md bg-primary-600 text-white mb-0">{Math.floor(offset / limit) + 1}</span>
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
          <VendorFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            vendorId={modal.id}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default VendorListLayer;
