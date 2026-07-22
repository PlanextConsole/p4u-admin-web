import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { listPlatformVariables, deletePlatformVariable } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";
import PlatformVariableFormLayer from "./PlatformVariableFormLayer";

const PlatformVariableListLayer = () => {
  const [variables, setVariables] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listPlatformVariables({ limit, offset });
      setVariables(res.items || []);
      setTotal(typeof res.total === "number" ? res.total : 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this variable?")) return;
    try {
      await deletePlatformVariable(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const filtered = useMemo(() => (
    search.trim()
      ? variables.filter((v) => (v.key || "").toLowerCase().includes(search.toLowerCase()))
      : variables
  ), [variables, search]);

  const getVal = (row) => {
    const v = row.value;
    if (v == null) return { amount: "", valueType: "", currencyType: "", description: "" };
    if (typeof v === "object") return { amount: v.amount ?? v.text ?? "", valueType: v.valueType || "", currencyType: v.currencyType || "None", description: v.description || "" };
    return { amount: String(v), valueType: "", currencyType: "", description: "" };
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt)) return "—";
    return dt.toISOString().replace("T", " ").substring(0, 19);
  };

  const canPrev = offset > 0;
  const canNext = offset + limit < total;
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p4u-vendors-page">
      <div className="p4u-vendors-hero">
        <div>
          <h3>Platform Variables</h3>
          <p>{total.toLocaleString("en-IN")} variables · System configuration keys</p>
        </div>
      </div>

      <div className="p4u-vendors-stats">
        <div className="p4u-vendors-stat is-total">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:variable" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Total Variables</p>
            <p className="p4u-vendors-stat__value">{total}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-verified">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:file-document-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">This Page</p>
            <p className="p4u-vendors-stat__value">{variables.length}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-pending">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:magnify" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Matches</p>
            <p className="p4u-vendors-stat__value">{filtered.length}</p>
          </div>
        </div>
        <div className="p4u-vendors-stat is-rejected">
          <span className="p4u-vendors-stat__icon"><Icon icon="mdi:book-open-page-variant-outline" /></span>
          <div>
            <p className="p4u-vendors-stat__label">Page</p>
            <p className="p4u-vendors-stat__value">{page}/{totalPages}</p>
          </div>
        </div>
      </div>

      <div className="p4u-vendors-toolbar">
        <label className="p4u-vendors-search">
          <Icon icon="mdi:magnify" />
          <input
            type="search"
            placeholder="Search platform variables…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="p4u-vendors-toolbar__actions">
          <button type="button" className="p4u-vendors-btn-primary" onClick={() => setModal({ mode: "add" })}>
            <Icon icon="ic:baseline-plus" />
            Add Variable
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      <div className="p4u-vendors-table-wrap">
        {loading ? (
          <p className="text-secondary-light mb-0 p-24">Loading platform variables...</p>
        ) : (
          <>
            <table className="p4u-vendors-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Variable Type</th>
                  <th>Value</th>
                  <th>Value Type</th>
                  <th>Currency Type</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((row, index) => {
                    const v = getVal(row);
                    return (
                      <tr key={row.id}>
                        <td>{offset + index + 1}</td>
                        <td className="business-name">{row.key || "—"}</td>
                        <td>{v.amount}</td>
                        <td>{v.valueType || "—"}</td>
                        <td>{v.currencyType || "None"}</td>
                        <td>{formatDate(row.createdAt)}</td>
                        <td>
                          <div className="d-flex align-items-center gap-8">
                            <button
                              type="button"
                              className="p4u-vendors-view-btn"
                              title="View"
                              onClick={() => setModal({ mode: "view", id: row.id })}
                            >
                              <Icon icon="mdi:eye-outline" />
                            </button>
                            <button
                              type="button"
                              className="p4u-vendors-view-btn"
                              title="Edit"
                              onClick={() => setModal({ mode: "edit", id: row.id })}
                            >
                              <Icon icon="mdi:pencil-outline" />
                            </button>
                            <button
                              type="button"
                              className="p4u-vendors-view-btn"
                              title="Delete"
                              style={{ color: "#dc2626" }}
                              onClick={() => handleDelete(row.id)}
                            >
                              <Icon icon="mdi:trash-can-outline" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={7} className="text-center py-4">No platform variables found.</td></tr>
                )}
              </tbody>
            </table>

            <div className="p4u-vendors-toolbar" style={{ marginTop: 16, marginBottom: 0 }}>
              <span className="text-secondary-light text-sm">{page} of {totalPages}</span>
              <div className="p4u-vendors-toolbar__actions">
                <button
                  type="button"
                  className="p4u-vendors-btn-outline"
                  disabled={!canPrev}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="p4u-vendors-btn-outline"
                  disabled={!canNext}
                  onClick={() => setOffset(offset + limit)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="lg">
          <PlatformVariableFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            variableId={modal.id}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default PlatformVariableListLayer;
