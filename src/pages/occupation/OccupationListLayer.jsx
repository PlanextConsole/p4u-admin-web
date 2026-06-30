import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { deleteOccupation, getPlatformVariableByKey, listOccupations, OCCUPATION_ADMIN_CREATE_ENABLED_KEY } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { isPlatformVariableRowAllowingAction } from "../../lib/platformVariableValue";
import { formatDateTime } from "../../lib/formatters";
import FormModal from "../../components/admin/FormModal";
import OccupationFormLayer from "./OccupationFormLayer";

function formatOccDisplayId(index) {
  return `OCC${String(index + 1).padStart(7, "0")}`;
}

function exportOccupationsCsv(rows, sorted) {
  const displayIndexById = new Map();
  sorted.forEach((row, i) => displayIndexById.set(row.id, i));
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [["ID", "Occupation", "Customers", "Status", "Created", "Updated"].join(",")];
  rows.forEach((row) => {
    const idx = displayIndexById.get(row.id) ?? 0;
    lines.push([
      esc(formatOccDisplayId(idx)),
      esc(row.name),
      esc(row.customerCount ?? 0),
      esc(row.isActive !== false ? "Active" : "Inactive"),
      esc(formatDateTime(row.createdAt)),
      esc(formatDateTime(row.updatedAt)),
    ].join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `occupations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const MetricCard = ({ title, value, icon, tone = "teal" }) => (
  <div className={`p4u-ref-metric p4u-ref-metric--${tone}`}>
    <Icon icon={icon} />
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  </div>
);

export default function OccupationListLayer() {
  const [items, setItems] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [occupationAddAllowed, setOccupationAddAllowed] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listOccupations({ purpose: "all" });
      setItems(Array.isArray(res.items) ? res.items : []);
      setTotalCustomers(typeof res.totalCustomers === "number" ? res.totalCustomers : 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setItems([]);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPlatformVariableByKey(OCCUPATION_ADMIN_CREATE_ENABLED_KEY);
        if (!cancelled) setOccupationAddAllowed(isPlatformVariableRowAllowingAction(res?.item, true));
      } catch {
        if (!cancelled) setOccupationAddAllowed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => {
    const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (so !== 0) return so;
    return String(a.name || "").localeCompare(String(b.name || ""));
  }), [items]);

  const filtered = useMemo(() => {
    let rows = sorted;
    if (statusFilter === "active") rows = rows.filter((r) => r.isActive !== false);
    if (statusFilter === "inactive") rows = rows.filter((r) => r.isActive === false);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => String(r.name || "").toLowerCase().includes(q));
    return rows;
  }, [sorted, search, statusFilter]);

  const displayIndexById = useMemo(() => {
    const m = new Map();
    sorted.forEach((row, i) => m.set(row.id, i));
    return m;
  }, [sorted]);

  const activeCount = useMemo(() => items.filter((r) => r.isActive !== false).length, [items]);

  async function onDelete(id) {
    if (!window.confirm("Delete this occupation? Customers using it may need to be reassigned first.")) return;
    try {
      await deleteOccupation(id);
      toast.success("Occupation deleted.");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  }

  return (
    <div className="p4u-ref-page p4u-occupations-page">
      <div className="p4u-ref-heading">
        <h1>Occupations</h1>
        <p>{items.length.toLocaleString("en-IN")} occupation type{items.length === 1 ? "" : "s"}</p>
      </div>

      <div className="p4u-ref-metric-grid p4u-ref-metric-grid--3">
        <MetricCard title="Total Occupations" value={items.length.toLocaleString("en-IN")} icon="mdi:briefcase-outline" />
        <MetricCard title="Active" value={activeCount.toLocaleString("en-IN")} icon="mdi:check-circle-outline" tone="green" />
        <MetricCard title="Total Customers" value={totalCustomers.toLocaleString("en-IN")} icon="mdi:account-group-outline" tone="blue" />
      </div>

      <div className="p4u-ref-table-card">
        <div className="p4u-ref-toolbar">
          <label className="p4u-ref-search">
            <Icon icon="mdi:magnify" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search occupations..." />
          </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="p4u-ref-toolbar-actions">
            <button className="p4u-ref-primary" type="button" disabled={!occupationAddAllowed} onClick={() => occupationAddAllowed && setModal({ mode: "add" })}>
              <Icon icon="ic:baseline-plus" /> Add Occupation
            </button>
            <button className="p4u-ref-outline" type="button" onClick={() => exportOccupationsCsv(filtered, sorted)}>
              <Icon icon="mdi:download-outline" /> Export CSV
            </button>
          </div>
        </div>

        {error && <div className="p4u-ref-alert">{error}</div>}
        {loading ? (
          <div className="p4u-ref-empty">Loading occupations...</div>
        ) : (
          <div className="p4u-ref-table-wrap">
            <table className="p4u-ref-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Occupation</th>
                  <th>Customers</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p4u-ref-empty">No occupations match your filters.</td></tr>
                ) : filtered.map((row) => {
                  const idx = displayIndexById.get(row.id) ?? 0;
                  return (
                    <tr key={row.id}>
                      <td>{formatOccDisplayId(idx)}</td>
                      <td>{row.name || "-"}</td>
                      <td>{Number(row.customerCount ?? 0).toLocaleString("en-IN")}</td>
                      <td><span className={`p4u-ref-status ${row.isActive !== false ? "is-active" : "is-inactive"}`}>{row.isActive !== false ? "Active" : "Inactive"}</span></td>
                      <td>{formatDateTime(row.createdAt)}</td>
                      <td>{formatDateTime(row.updatedAt)}</td>
                      <td>
                        <div className="p4u-ref-row-actions">
                          <button type="button" onClick={() => setModal({ mode: "edit", id: row.id })} aria-label="Edit"><Icon icon="mdi:pencil-outline" /></button>
                          <button type="button" className="danger" onClick={() => onDelete(row.id)} aria-label="Delete"><Icon icon="mdi:trash-can-outline" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="md">
          <OccupationFormLayer
            isEdit={modal.mode === "edit"}
            occupationId={modal.id}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
}
