import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createOccupation,
  getOccupation,
  updateOccupation,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const empty = () => ({ name: "", sortOrder: 0, isActive: true });

export default function OccupationFormLayer({ isEdit = false, isView = false, occupationId }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(Boolean(occupationId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const apply = useCallback((row) => {
    setForm({
      name: row.name || "",
      sortOrder: row.sortOrder ?? 0,
      isActive: row.isActive !== false,
    });
  }, []);

  useEffect(() => {
    if (!occupationId) {
      setLoading(false);
      return;
    }
    let c = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const row = await getOccupation(occupationId);
        if (!c) apply(row);
      } catch (e) {
        if (!c) {
          const msg = e instanceof ApiError ? e.message : String(e);
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [occupationId, apply]);

  function handleChange(e) {
    if (isView) return;
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
    } else if (name === "sortOrder") {
      setForm((p) => ({ ...p, sortOrder: value === "" ? 0 : Number(value) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (isView) return;
    const name = form.name.trim();
    if (!name) {
      toast.error("Name is required.");
      return;
    }
    const body = {
      name,
      sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
      isActive: form.isActive,
    };
    setSubmitting(true);
    try {
      if (isEdit && occupationId) {
        await updateOccupation(occupationId, body);
        toast.success("Occupation updated.");
      } else {
        await createOccupation(body);
        toast.success("Occupation created.");
      }
      navigate("/occupations");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const dis = isView || submitting || loading;

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h4 className="text-lg fw-semibold mb-0">
          {isView ? "View Occupation" : isEdit ? "Edit Occupation" : "Add Occupation"}
        </h4>
      </div>
      <div className="card-body p-24">
        {loadError && occupationId && !loading && (
          <div className="alert alert-danger radius-12 mb-16" role="alert">
            {loadError}
          </div>
        )}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading...</p>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="row">
              <div className="col-md-8 mb-20">
                <label className="form-label fw-semibold text-sm mb-8">
                  Name <span className="text-danger-600">*</span>
                </label>
                <input
                  name="name"
                  className="form-control radius-8"
                  value={form.name}
                  onChange={handleChange}
                  disabled={dis}
                  maxLength={255}
                  required
                />
              </div>
              <div className="col-md-4 mb-20">
                <label className="form-label fw-semibold text-sm mb-8">Sort order</label>
                <input
                  type="number"
                  name="sortOrder"
                  className="form-control radius-8"
                  value={form.sortOrder}
                  onChange={handleChange}
                  disabled={dis}
                  min={0}
                />
              </div>
              <div className="col-12 mb-20">
                <div className="form-check">
                  <input
                    type="checkbox"
                    name="isActive"
                    className="form-check-input"
                    id="occ-active"
                    checked={form.isActive}
                    onChange={handleChange}
                    disabled={dis}
                  />
                  <label className="form-check-label" htmlFor="occ-active">
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-between mt-24">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn border border-danger-600 text-danger-600 radius-8 px-56 py-12 d-flex align-items-center gap-2"
              >
                <Icon icon="mdi:close-circle-outline" className="text-xl" /> Back
              </button>
              {!isView && (
                <button type="submit" disabled={dis} className="btn btn-primary radius-8 px-56 py-12 d-flex align-items-center gap-2">
                  <Icon icon="lucide:save" className="text-xl" /> {submitting ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
