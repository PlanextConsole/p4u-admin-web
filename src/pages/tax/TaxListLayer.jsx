import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  deleteTaxConfiguration,
  listTaxConfigurations,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";
import TaxFormLayer from "./TaxFormLayer";

const TaxListLayer = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listTaxConfigurations({ purpose: "all" });
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.code || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const activeCount = useMemo(() => items.filter((r) => r.isActive !== false).length, [items]);
  const rowForId = (id) => items.find((t) => t.id === id) || null;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tax rate?")) return;
    try {
      await deleteTaxConfiguration(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  return (
    <div className="p4u-vendors-page">
      <div className="p4u-vendors-hero">
        <div>
          <h3>Tax Management</h3>
          <p>{items.length} tax rate{items.length === 1 ? "" : "s"} · Platform tax configuration</p>
        </div>
      </div>

      <div className="p4u-vendors-stats">
        <div className="p4u-vendors-stat is-total">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:percent-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Total Rates</p>
            <p className="p4u-vendors-stat__value">{items.length}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-verified">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:check-circle-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Active</p>
            <p className="p4u-vendors-stat__value">{activeCount}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-pending">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:pause-circle-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Inactive</p>
            <p className="p4u-vendors-stat__value">{Math.max(0, items.length - activeCount)}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-rejected">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:filter-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Showing</p>
            <p className="p4u-vendors-stat__value">{filtered.length}</p>
          </div>
        </div>
      </div>

      <div className="p4u-vendors-toolbar">
        <label className="p4u-vendors-search">
          <Icon icon="mdi:magnify" />
          <input
            type="search"
            placeholder="Search tax…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="p4u-vendors-toolbar__actions">
          <button type="button" className="p4u-vendors-btn-primary" onClick={() => setModal({ mode: "add" })}>
            <Icon icon="ic:baseline-plus" />
            Add Tax
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      <div className="p4u-vendors-table-wrap">
        {loading ? (
          <p className="text-secondary-light mb-0 p-24">Loading...</p>
        ) : (
          <table className="p4u-vendors-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Code</th>
                <th>Title</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">No tax records found.</td>
                </tr>
              ) : (
                filtered.map((tax, index) => (
                  <tr key={tax.id}>
                    <td>{index + 1}</td>
                    <td className="business-name">{tax.code || "—"}</td>
                    <td>{tax.title || "—"}</td>
                    <td>
                      <span className="p4u-vendor-pill is-verified">
                        {tax.percentage != null ? `${tax.percentage}%` : "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`p4u-vendor-pill ${tax.isActive !== false ? "is-verified" : "is-rejected"}`}>
                        {tax.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <span className="business-owner">
                        {(tax.metadata && tax.metadata.description) || "—"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-8">
                        <button
                          type="button"
                          className="p4u-vendors-view-btn"
                          title="Edit"
                          onClick={() => setModal({ mode: "edit", id: tax.id })}
                        >
                          <Icon icon="mdi:pencil-outline" />
                        </button>
                        <button
                          type="button"
                          className="p4u-vendors-view-btn"
                          title="Delete"
                          style={{ color: "#dc2626" }}
                          onClick={() => handleDelete(tax.id)}
                        >
                          <Icon icon="mdi:trash-can-outline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="md">
          <TaxFormLayer
            isEdit={modal.mode === "edit"}
            initialData={modal.id ? rowForId(modal.id) : null}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default TaxListLayer;
