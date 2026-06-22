import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { deleteVendor, listVendors, listPendingVendorSignups, approveVendorRequest } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";
import FormModal from "../../components/admin/FormModal";
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

function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

function signupRequestToRow(req) {
  const p = req?.payload && typeof req.payload === "object" ? req.payload : {};
  return {
    id: `signup-${req.id}`,
    businessName: String(p.businessName || "—"),
    ownerName: String(p.ownerName || "—"),
    email: p.email ? String(p.email) : "—",
    phone: p.phone ? String(p.phone) : "—",
    createdAt: req.createdAt,
    __status: "pending",
    __signupRequestId: req.id,
  };
}

/**
 * @param {{ vendorKind: 'product'|'service', pageTitle: string, pageSubtitle?: string, addButtonLabel: string, searchPlaceholder?: string, csvFilenamePrefix?: string }} props
 */
const VendorListLayer = ({
  vendorKind,
  pageTitle,
  pageSubtitle,
  addButtonLabel,
  searchPlaceholder,
  csvFilenamePrefix,
}) => {
  const [vendors, setVendors] = useState([]);
  const [signupPending, setSignupPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("pending");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, signupRes] = await Promise.all([
        listVendors({ limit: 500, offset: 0, vendorKind }),
        listPendingVendorSignups({ vendorKind }).catch(() => ({ items: [] })),
      ]);
      setVendors(res.items || []);
      setSignupPending(signupRes.items || []);
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

  const rows = useMemo(() => {
    const catalog = vendors.map((v) => ({ ...v, __status: normalizeStatus(v) }));
    const orphans = signupPending.map(signupRequestToRow);
    return [...catalog, ...orphans];
  }, [vendors, signupPending]);

  const counts = useMemo(() => {
    const c = { total: rows.length, verified: 0, pending: 0, rejected: 0, deactivated: 0, deleted: 0 };
    rows.forEach((r) => { if (r.__status in c) c[r.__status] += 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((v) => {
      if (statusTab && v.__status !== statusTab) return false;
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
        (v.phone || "").includes(q)
      );
    });
  }, [rows, statusTab, fromDate, toDate, search]);

  const exportCsv = () => {
    const rowsCsv = [
      ["Reference", "Business", "Owner", "Email", "Mobile", "Status", "Created"],
      ...filtered.map((v) => [
        v.vendorRef || "",
        v.businessName || "",
        v.ownerName || "",
        v.email || "",
        v.phone || "",
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

  return (
    <div className='card h-100 p-0 radius-16 border-0 shadow-sm'>
      <div className='card-body p-24'>
        <div className='mb-20'>
          <h3 className='fw-bold mb-4'>{pageTitle}</h3>
          <p className='text-secondary-light mb-0'>
            {pageSubtitle ?? (
              <>
                {vendors.length} in catalog
                {signupPending.length > 0 ? ` · ${signupPending.length} signup${signupPending.length === 1 ? "" : "s"} awaiting catalog row` : ""}
                {" · "}
                Check <strong>Service vendors</strong> if a signup is missing here · Classified listings use <strong>CF vendors</strong>
              </>
            )}
          </p>
        </div>

        <div className='bg-primary-50 radius-12 p-6 p4u-admin-filter-row gap-6 mb-16'>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type='button'
              onClick={() => setStatusTab(tab.key)}
              className={`btn border-0 radius-10 px-14 py-8 ${statusTab === tab.key ? "bg-white fw-semibold text-primary-600" : "bg-transparent text-secondary-light"}`}
            >
              {tab.label}
              {tab.key === "deactivated" ? ` (${counts.deactivated})` : ""}
              {tab.key === "deleted" ? ` (${counts.deleted})` : ""}
            </button>
          ))}
        </div>

        <div className='row g-12 mb-16'>
          <SummaryCard title={vendorKind === "service" ? "Total service vendors" : "Total product vendors"} value={counts.total} icon='mdi:storefront-outline' color='info' />
          <SummaryCard title='Verified' value={counts.verified} icon='mdi:shield-check-outline' color='success' />
          <SummaryCard title='Pending' value={counts.pending} icon='mdi:clock-outline' color='warning' />
          <SummaryCard title='Rejected' value={counts.rejected} icon='mdi:close-circle-outline' color='danger' />
        </div>

        <div className='card radius-12 border-0 mb-16'>
          <div className='card-body p-16 p4u-admin-filter-row gap-10 align-items-center'>
            <div className='input-group radius-10 p4u-filter-search' style={{ minWidth: 160, maxWidth: 300 }}>
              <span className='input-group-text bg-white border-end-0'><Icon icon='mdi:magnify' /></span>
              <input
                type='text'
                className='form-control border-start-0 h-40-px'
                placeholder={searchPlaceholder || "Search vendors"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <input type='date' className='form-control radius-10 h-40-px' value={fromDate} onChange={(e) => setFromDate(e.target.value)} title='From date' />
            <input type='date' className='form-control radius-10 h-40-px' value={toDate} onChange={(e) => setToDate(e.target.value)} title='To date' />
            <div className='p4u-admin-filter-row__end gap-8'>
              <button type='button' onClick={() => setModal({ mode: "add" })} className='btn btn-primary radius-10 px-20 d-flex align-items-center gap-8'>
                <Icon icon='ic:baseline-plus' /> {addButtonLabel}
              </button>
              <button type='button' onClick={exportCsv} className='btn btn-outline-secondary radius-10 d-flex align-items-center gap-8'>
                <Icon icon='mdi:download-outline' /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {error && <div className='alert alert-danger radius-12 mb-16' role='alert'>{error}</div>}
        {loading ? (
          <p className='text-secondary-light mb-0'>Loading vendors...</p>
        ) : (
          <div className='table-responsive scroll-sm' style={{ overflowX: "auto" }}>
              <table className='table bordered-table sm-table mb-0' style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th className='text-nowrap' style={{ width: 48 }}>#</th>
                    <th>BUSINESS</th>
                    <th>EMAIL</th>
                    <th>MOBILE</th>
                    <th className='text-nowrap'>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((vendor, rowIndex) => (
                        <tr key={vendor.id}>
                          <td className='text-secondary-light text-sm'>{rowIndex + 1}</td>
                          <td>
                            <div className='fw-semibold text-primary-light'>{vendor.businessName || "—"}</div>
                            <div className='text-neutral-600 text-sm'>{vendor.ownerName || "—"}</div>
                            {vendor.__signupRequestId ? (
                              <span className='badge bg-warning-100 text-warning-700 text-xs mt-1'>Signup only</span>
                            ) : null}
                          </td>
                          <td>{vendor.email || "—"}</td>
                          <td>{vendor.phone || "—"}</td>
                          <td>
                            <div className='d-flex align-items-center gap-10'>
                              {vendor.__signupRequestId ? (
                                <button
                                  type='button'
                                  onClick={() => void handleApproveSignup(vendor.__signupRequestId)}
                                  className='btn btn-success btn-sm radius-10 px-12'
                                >
                                  Approve
                                </button>
                              ) : (
                                <>
                                  <button type='button' onClick={() => setModal({ mode: "view", id: vendor.id })} className='btn btn-light border-0 rounded-circle d-flex align-items-center justify-content-center text-secondary-light' style={{ width: 36, height: 36 }}>
                                    <Icon icon='majesticons:eye-line' className='text-xl' />
                                  </button>
                                  <button type='button' onClick={() => setModal({ mode: "edit", id: vendor.id })} className='btn btn-light border-0 rounded-circle d-flex align-items-center justify-content-center text-secondary-light' style={{ width: 36, height: 36 }}>
                                    <Icon icon='lucide:edit' className='text-xl' />
                                  </button>
                                  <button type='button' onClick={() => void handleDelete(vendor.id)} className='btn btn-light border-0 rounded-circle d-flex align-items-center justify-content-center text-danger-600' style={{ width: 36, height: 36 }}>
                                    <Icon icon='fluent:delete-24-regular' className='text-xl' />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                    ))
                  ) : (
                    <tr><td colSpan='5' className='text-center py-4'>No vendors found.</td></tr>
                  )}
                </tbody>
              </table>
          </div>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size='xl'>
          <VendorFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            vendorId={modal.id}
            vendorKind={vendorKind}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }) => {
  const map = {
    info: "bg-info-50 text-info-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  };
  return (
    <div className='col-sm-6 col-xl-3'>
      <div className='radius-12 p-16 bg-neutral-50 border'>
        <div className='d-flex align-items-center gap-10'>
          <span className={`w-40-px h-40-px rounded-circle d-flex align-items-center justify-content-center ${map[color]}`}>
            <Icon icon={icon} className='text-xl' />
          </span>
          <div>
            <div className='text-sm text-secondary-light'>{title}</div>
            <h5 className='mb-0 fw-bold'>{value}</h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorListLayer;
