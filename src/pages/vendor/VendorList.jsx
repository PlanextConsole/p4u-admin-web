import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  approveVendorRequest,
  deleteVendor,
  listPendingVendorApplications,
  listVendors,
  rejectVendorRequest,
  updateVendor,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";
import FormModal from "../../components/admin/FormModal";
import TableActionButtons from "../../components/admin/TableActionButtons";
import VendorFormLayer from "./VendorFormLayer";

const STATUS_TABS = [
  { key: "pending", label: "Pending Approval" },
  { key: "verified", label: "All Verified Vendors" },
  { key: "rejected", label: "Rejected" },
  { key: "deactivated", label: "Deactivated" },
  { key: "deleted", label: "Deleted" },
];

/**
 * “All Verified Vendors” = DB status `active` only.
 * `not_verified` and `pending` stay in Pending until an admin sets Verified (active).
 */
function normalizeStatus(v) {
  const s = String(v?.status || "").trim().toLowerCase();
  if (!s) return "pending";
  if (s === "active") return "verified";
  if (s === "pending" || s === "not_verified") return "pending";
  if (s === "rejected") return "rejected";
  if (s === "suspended") return "deactivated";
  if (s.includes("delete")) return "deleted";
  if (s.includes("reject")) return "rejected";
  if (s.includes("suspend") || s.includes("deactive")) return "deactivated";
  return "pending";
}

function formatPhoneDisplay(phone) {
  if (!phone) return "—";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2)}`;
  return String(phone);
}

function formatTaxCell(gst, pan) {
  const parts = [];
  if (gst && String(gst).trim()) parts.push(`GST: ${String(gst).trim()}`);
  if (pan && String(pan).trim()) parts.push(`PAN: ${String(pan).trim()}`);
  return parts.length ? parts.join(" · ") : "—";
}

function applicationToRow(app) {
  return {
    id: app.catalogVendorId || app.id,
    businessName: app.businessName || "—",
    ownerName: app.ownerName || "—",
    email: app.email || "—",
    phone: app.phone || "—",
    vendorType: app.vendorType || (app.vendorKind === "service" ? "SERVICE" : "PRODUCT"),
    categoryLabel: app.categoryLabel || app.businessType || "—",
    businessType: app.businessType || null,
    gst: app.gst,
    pan: app.pan,
    createdAt: app.createdAt,
    __status: "pending",
    __signupRequestId: app.signupRequestId || null,
    __catalogVendorId: app.catalogVendorId || null,
    __source: app.source || "catalog",
  };
}

function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

function formatVendorDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  const day = dt.toLocaleString("en-IN", { day: "2-digit" });
  const mon = dt.toLocaleString("en-IN", { month: "short" });
  const yr = String(dt.getFullYear()).slice(-2);
  const time = dt.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} ${mon} ${yr}, ${time}`;
}

function resolvePaymentStatus(v) {
  const docs = v.documentsJson && typeof v.documentsJson === "object" ? v.documentsJson : {};
  return String(v.paymentStatus || docs.paymentStatus || v.membershipStatus || "unpaid").toLowerCase();
}

function formatCommission(v) {
  const n = v.commissionRate;
  if (n == null || n === "") return "—";
  return `${Number(n)}%`;
}

function statusPill(statusKey) {
  const map = {
    verified: { label: "Verified", cls: "p4u-vendor-pill is-verified" },
    pending: { label: "Pending", cls: "p4u-vendor-pill is-pending" },
    rejected: { label: "Rejected", cls: "p4u-vendor-pill is-rejected" },
    deactivated: { label: "Deactivated", cls: "p4u-vendor-pill is-deactivated" },
    deleted: { label: "Deleted", cls: "p4u-vendor-pill is-deactivated" },
  };
  return map[statusKey] || { label: statusKey, cls: "p4u-vendor-pill is-pending" };
}

function paymentPill(value) {
  const p = String(value || "unpaid").toLowerCase();
  if (p === "paid") return { label: "paid", cls: "p4u-vendor-pill is-paid" };
  return { label: "unpaid", cls: "p4u-vendor-pill is-unpaid" };
}

/**
 * @param {{ vendorKind: 'product'|'service', pageTitle?: string, pageSubtitle?: string, addButtonLabel: string, searchPlaceholder?: string, csvFilenamePrefix?: string, headerLinkLabel?: string, headerLinkTo?: string }} props
 */
const VendorListLayer = ({
  vendorKind,
  pageTitle = "Vendors",
  pageSubtitle,
  addButtonLabel,
  searchPlaceholder,
  csvFilenamePrefix,
  headerLinkLabel,
  headerLinkTo,
}) => {
  const [vendors, setVendors] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [statusTab, setStatusTab] = useState("pending");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, pendingRes] = await Promise.all([
        listVendors({ limit: 500, offset: 0, vendorKind }),
        listPendingVendorApplications({ vendorKind }).catch(() => ({ items: [] })),
      ]);
      setVendors(res.items || []);
      setPendingApplications(pendingRes.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [vendorKind]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, signupRequestId) => {
    if (signupRequestId) {
      toast.info("Use Approve to provision this signup request.");
      return;
    }
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await deleteVendor(id);
      toast.success("Vendor deleted.");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const handleApproveSignup = async (signupId) => {
    if (!window.confirm("Approve this vendor signup and create their catalog profile?")) return;
    try {
      await approveVendorRequest(signupId, {});
      toast.success("Vendor signup approved.");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const handleApproveCatalog = async (vendorId) => {
    if (!window.confirm("Approve this vendor application?")) return;
    try {
      await updateVendor(vendorId, { status: "active" });
      toast.success("Vendor approved.");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const handleRejectSignup = async (signupId) => {
    if (!window.confirm("Reject this vendor signup? They will be told their request was rejected.")) return;
    try {
      await rejectVendorRequest(signupId, {});
      toast.success("Vendor signup rejected.");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const handleRejectCatalog = async (vendorId) => {
    if (!window.confirm("Reject this vendor application?")) return;
    try {
      await updateVendor(vendorId, { status: "rejected" });
      toast.success("Vendor rejected.");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const catalogRows = useMemo(
    () => vendors.map((v) => ({ ...v, __status: normalizeStatus(v), __source: "catalog" })),
    [vendors],
  );

  const pendingRows = useMemo(
    () => pendingApplications.map(applicationToRow),
    [pendingApplications],
  );

  const rows = useMemo(() => {
    if (statusTab === "pending") return pendingRows;
    return catalogRows;
  }, [statusTab, pendingRows, catalogRows]);

  const counts = useMemo(() => {
    const c = {
      total: catalogRows.length + pendingRows.filter((r) => r.__source === "signup").length,
      verified: 0,
      pending: pendingRows.length,
      rejected: 0,
      deactivated: 0,
      deleted: 0,
    };
    catalogRows.forEach((r) => {
      if (r.__status in c && r.__status !== "pending") c[r.__status] += 1;
    });
    return c;
  }, [catalogRows, pendingRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((v) => {
      if (statusTab !== "pending" && statusTab && v.__status !== statusTab) return false;
      if (paymentFilter && statusTab !== "pending") {
        if (resolvePaymentStatus(v) !== paymentFilter) return false;
      }
      if (fromDate) {
        const d = new Date(v.createdAt);
        if (Number.isNaN(d.getTime()) || d < new Date(fromDate)) return false;
      }
      if (toDate) {
        const d = new Date(v.createdAt);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (Number.isNaN(d.getTime()) || d > end) return false;
      }
      if (!q) return true;
      return (
        (v.ownerName || "").toLowerCase().includes(q) ||
        (v.businessName || "").toLowerCase().includes(q) ||
        (v.email || "").toLowerCase().includes(q) ||
        String(v.phone || "").includes(q) ||
        (v.categoryLabel || "").toLowerCase().includes(q) ||
        (v.businessType || "").toLowerCase().includes(q)
      );
    });
  }, [rows, statusTab, fromDate, toDate, search, paymentFilter]);

  const exportCsv = () => {
    const rowsCsv = [
      ["Reference", "Business", "Owner", "Email", "Mobile", "Type", "Category", "GST", "PAN", "Status", "Submitted"],
      ...filtered.map((v) => [
        v.vendorRef || "",
        v.businessName || "",
        v.ownerName || "",
        v.email || "",
        formatPhoneDisplay(v.phone),
        v.vendorType || "",
        v.categoryLabel || "",
        v.gst || "",
        v.pan || "",
        v.__status,
        v.createdAt || "",
      ]),
    ];
    const csv = toCsv(rowsCsv);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${csvFilenamePrefix || "vendors"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Catalog rows use `id`; signup-only pending rows use the application view instead. */
  const openVendorId = (vendor) => {
    if (vendor.__signupRequestId && !vendor.__catalogVendorId && vendor.__source === "signup") {
      return null;
    }
    return vendor.__catalogVendorId || vendor.id || null;
  };

  const heroSubtitle =
    pageSubtitle ??
    `${counts.verified} registered vendors · Multi-level approval`;

  return (
    <div className='p4u-vendors-page'>
      <header className='p4u-vendors-hero'>
        <div>
          <h3>{pageTitle}</h3>
          <p>{heroSubtitle}</p>
        </div>
        {headerLinkLabel && headerLinkTo ? (
          <Link to={headerLinkTo} className='p4u-vendors-hero__action'>
            <Icon icon='ic:baseline-plus' /> {headerLinkLabel}
          </Link>
        ) : null}
      </header>

      <nav className='p4u-vendors-tabs' aria-label='Vendor status filters'>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type='button'
            className={statusTab === tab.key ? "is-active" : ""}
            onClick={() => setStatusTab(tab.key)}
          >
            {tab.label}
            {tab.key === "pending" ? ` (${counts.pending})` : ""}
            {tab.key === "deactivated" ? ` (${counts.deactivated})` : ""}
            {tab.key === "deleted" ? ` (${counts.deleted})` : ""}
          </button>
        ))}
      </nav>

      <section className='p4u-vendors-stats' aria-label='Vendor overview'>
        <SummaryCard title='Total Vendors' value={counts.total} icon='mdi:storefront-outline' tone='total' />
        <SummaryCard title='Verified' value={counts.verified} icon='mdi:shield-check-outline' tone='verified' />
        <SummaryCard title='Pending' value={counts.pending} icon='mdi:clock-outline' tone='pending' />
        <SummaryCard title='Rejected' value={counts.rejected} icon='mdi:close-circle-outline' tone='rejected' />
      </section>

      <div className='p4u-vendors-toolbar'>
        <label className='p4u-vendors-search'>
          <Icon icon='mdi:magnify' />
          <input
            type='search'
            placeholder={searchPlaceholder || "Search vendors..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {statusTab !== "pending" ? (
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} aria-label='Payment filter'>
            <option value=''>Payment</option>
            <option value='paid'>Paid</option>
            <option value='unpaid'>Unpaid</option>
            <option value='partial'>Partial</option>
          </select>
        ) : null}
        <input type='date' value={fromDate} onChange={(e) => setFromDate(e.target.value)} title='From date' aria-label='From date' />
        <input type='date' value={toDate} onChange={(e) => setToDate(e.target.value)} title='To date' aria-label='To date' />
        <div className='p4u-vendors-toolbar__actions'>
          <button type='button' onClick={() => setModal({ mode: "add" })} className='p4u-vendors-btn-primary'>
            <Icon icon='ic:baseline-plus' /> {addButtonLabel}
          </button>
          <button type='button' onClick={exportCsv} className='p4u-vendors-btn-outline'>
            <Icon icon='mdi:download-outline' /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className='alert alert-danger radius-12 mb-16' role='alert'>{error}</div>}
      {loading ? (
        <p className='text-secondary-light mb-0'>Loading vendors...</p>
      ) : (
        <div className='p4u-vendors-table-wrap'>
          <table className='p4u-vendors-table'>
            <thead>
              <tr>
                {statusTab === "pending" ? <th>#</th> : null}
                <th>Business</th>
                <th>Email</th>
                <th>Mobile</th>
                {statusTab === "pending" ? (
                  <>
                    <th>Type</th>
                    <th>Category</th>
                    <th>GST / PAN</th>
                    <th>Submitted</th>
                  </>
                ) : (
                  <>
                    <th>Commission</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Updated</th>
                  </>
                )}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((vendor, rowIndex) => {
                  const viewEditId = openVendorId(vendor);
                  const pay = paymentPill(resolvePaymentStatus(vendor));
                  const st = statusPill(vendor.__status);
                  return (
                    <tr key={vendor.id || vendor.__signupRequestId || rowIndex}>
                      {statusTab === "pending" ? (
                        <td className='text-secondary-light'>{rowIndex + 1}</td>
                      ) : null}
                      <td>
                        <div className='business-name'>{vendor.businessName || "—"}</div>
                        <div className='business-owner'>{vendor.ownerName || "—"}</div>
                        {vendor.__source === "signup" ? (
                          <span className='p4u-vendor-pill is-pending mt-1'>Signup only</span>
                        ) : null}
                      </td>
                      <td>{vendor.email || "—"}</td>
                      <td>{formatPhoneDisplay(vendor.phone)}</td>
                      {statusTab === "pending" ? (
                        <>
                          <td>
                            {vendor.vendorType === "SERVICE" ? "Service" : "Product"}
                            {vendor.businessType ? (
                              <div className='business-owner'>{vendor.businessType}</div>
                            ) : null}
                          </td>
                          <td>{vendor.categoryLabel || "—"}</td>
                          <td>{formatTaxCell(vendor.gst, vendor.pan)}</td>
                          <td>{vendor.createdAt ? formatVendorDateTime(vendor.createdAt) : "—"}</td>
                        </>
                      ) : (
                        <>
                          <td>{formatCommission(vendor)}</td>
                          <td><span className={pay.cls}>{pay.label}</span></td>
                          <td><span className={st.cls}>{st.label}</span></td>
                          <td>{vendor.createdAt ? formatVendorDateTime(vendor.createdAt) : "—"}</td>
                          <td>{vendor.updatedAt ? formatVendorDateTime(vendor.updatedAt) : "—"}</td>
                        </>
                      )}
                      <td>
                        <div className='d-flex align-items-center gap-8'>
                          {vendor.__signupRequestId ? (
                            <>
                              <button type='button' onClick={() => void handleApproveSignup(vendor.__signupRequestId)} className='btn btn-success btn-sm radius-10 px-12'>Approve</button>
                              <button type='button' onClick={() => void handleRejectSignup(vendor.__signupRequestId)} className='btn btn-outline-danger btn-sm radius-10 px-12'>Reject</button>
                            </>
                          ) : statusTab === "pending" && viewEditId ? (
                            <>
                              <button type='button' onClick={() => void handleApproveCatalog(viewEditId)} className='btn btn-success btn-sm radius-10 px-12'>Approve</button>
                              <button type='button' onClick={() => void handleRejectCatalog(viewEditId)} className='btn btn-outline-danger btn-sm radius-10 px-12'>Reject</button>
                            </>
                          ) : null}
                          {viewEditId ? (
                            <>
                              <button
                                type='button'
                                className='p4u-vendors-view-btn'
                                title='View vendor'
                                onClick={() => setModal({ mode: "view", id: viewEditId })}
                              >
                                <Icon icon='mdi:eye-outline' />
                              </button>
                              <TableActionButtons
                                actions={[
                                  { type: "edit", onClick: () => setModal({ mode: "edit", id: viewEditId }) },
                                  { type: "delete", onClick: () => void handleDelete(viewEditId) },
                                ]}
                              />
                            </>
                          ) : vendor.__signupRequestId ? (
                            <button
                              type='button'
                              className='p4u-vendors-view-btn'
                              title='View application'
                              onClick={() => setModal({ mode: "view", signupApplication: vendor })}
                            >
                              <Icon icon='mdi:eye-outline' />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={statusTab === "pending" ? 9 : 9} className='text-center py-4'>No vendors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormModal onClose={() => setModal(null)} size='xl'>
          {modal.signupApplication ? (
            <SignupApplicationView application={modal.signupApplication} onClose={() => setModal(null)} />
          ) : (
            <VendorFormLayer
              isEdit={modal.mode === "edit"}
              isView={modal.mode === "view"}
              vendorId={modal.id}
              vendorKind={vendorKind}
              onSuccess={() => { setModal(null); load(); }}
              onCancel={() => setModal(null)}
            />
          )}
        </FormModal>
      )}
    </div>
  );
};

function SignupApplicationView({ application, onClose }) {
  return (
    <div className='p-24'>
      <h4 className='fw-bold mb-16'>Vendor signup application</h4>
      <div className='row g-12 text-sm'>
        <DetailField label='Owner name' value={application.ownerName} />
        <DetailField label='Business name' value={application.businessName} />
        <DetailField label='Email' value={application.email} />
        <DetailField label='Mobile' value={formatPhoneDisplay(application.phone)} />
        <DetailField label='Vendor type' value={application.vendorType === "SERVICE" ? "Service vendor" : "Product vendor"} />
        <DetailField label='Category / business type' value={application.categoryLabel || application.businessType} />
        <DetailField label='GST' value={application.gst} />
        <DetailField label='PAN' value={application.pan} />
        <DetailField label='Submitted' value={application.createdAt ? formatDateTime(application.createdAt) : "—"} />
      </div>
      <p className='text-secondary-light text-sm mt-16 mb-0'>
        This application exists only in signup records. Use <strong>Approve</strong> to create the catalog vendor profile.
      </p>
      <div className='mt-20 d-flex justify-content-end'>
        <button type='button' className='btn btn-outline-secondary radius-10' onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className='col-md-6'>
      <div className='text-secondary-light text-xs mb-1'>{label}</div>
      <div className='fw-medium'>{value || "—"}</div>
    </div>
  );
}

const SummaryCard = ({ title, value, icon, tone }) => (
  <article className={`p4u-vendors-stat is-${tone}`}>
    <span className='p4u-vendors-stat__icon' aria-hidden='true'>
      <Icon icon={icon} />
    </span>
    <div>
      <p className='p4u-vendors-stat__label'>{title}</p>
      <p className='p4u-vendors-stat__value'>{value}</p>
    </div>
  </article>
);

export default VendorListLayer;
