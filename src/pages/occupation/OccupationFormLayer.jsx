import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createOccupation, getOccupation, updateOccupation } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const empty = () => ({ name: "", sortOrder: 0, isActive: true, customerCount: 0 });

export default function OccupationFormLayer({ isEdit = false, occupationId, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(Boolean(occupationId));
  const [submitting, setSubmitting] = useState(false);

  const apply = useCallback((row) => {
    setForm({
      name: row.name || "",
      sortOrder: row.sortOrder ?? 0,
      isActive: row.isActive !== false,
      customerCount: typeof row.customerCount === "number" ? row.customerCount : 0,
    });
  }, []);

  useEffect(() => {
    if (!occupationId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const row = await getOccupation(occupationId);
        if (!cancelled) apply(row);
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [occupationId, apply]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "status") setForm((p) => ({ ...p, isActive: value === "active" }));
    else setForm((p) => ({ ...p, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Occupation name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const body = { name, sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive };
      if (isEdit && occupationId) {
        await updateOccupation(occupationId, body);
        toast.success("Occupation updated.");
      } else {
        await createOccupation(body);
        toast.success("Occupation created.");
      }
      if (onSuccess) onSuccess();
      else navigate("/occupations");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p4u-ref-modal p4u-occupation-modal">
      <h2>{isEdit ? "Edit Occupation" : "New Occupation"}</h2>
      {loading ? <div className="p4u-ref-empty">Loading...</div> : (
        <form onSubmit={onSubmit}>
          <label className="p4u-ref-field">
            <span>Occupation Name *</span>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Occupation name" autoFocus />
          </label>
          <label className="p4u-ref-field">
            <span>Status</span>
            <select name="status" value={form.isActive ? "active" : "inactive"} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <div className="p4u-ref-modal-footer">
            <button type="button" onClick={() => (onCancel ? onCancel() : navigate(-1))}>Cancel</button>
            <button type="submit" disabled={submitting}>{submitting ? "Saving..." : isEdit ? "Save" : "Create"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
