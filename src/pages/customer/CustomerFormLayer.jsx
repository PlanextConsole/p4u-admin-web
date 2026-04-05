import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCustomer,
  getCustomer,
  listOccupations,
  updateCustomer,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const emptyForm = () => ({
  fullName: "",
  phone: "",
  email: "",
  status: "active",
  occupationId: "",
  keycloakUserId: "",
  metadataText: "",
});

function stringifyJson(value) {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseMetadata(text) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    throw new Error("Invalid JSON in metadata");
  }
}

/**
 * @param {{ isEdit?: boolean, isView?: boolean, customerId?: string }} props
 */
const CustomerFormLayer = ({ isEdit = false, isView = false, customerId }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [occupations, setOccupations] = useState([]);
  const [occLoading, setOccLoading] = useState(true);
  const [entityLoading, setEntityLoading] = useState(Boolean(customerId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOccLoading(true);
      try {
        const res = await listOccupations({ purpose: "all" });
        if (!cancelled) setOccupations(res.items || []);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : String(e);
          toast.error(`Occupations: ${msg}`);
        }
      } finally {
        if (!cancelled) setOccLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyRow = useCallback((row) => {
    setFormData({
      fullName: row.fullName || "",
      phone: row.phone || "",
      email: row.email || "",
      status: row.status || "active",
      occupationId: row.occupationId || "",
      keycloakUserId: row.keycloakUserId || "",
      metadataText: stringifyJson(row.metadata),
    });
  }, []);

  useEffect(() => {
    if (!customerId) {
      setEntityLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setEntityLoading(true);
      setLoadError("");
      try {
        const row = await getCustomer(customerId);
        if (!cancelled) applyRow(row);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : String(e);
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setEntityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, applyRow]);

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    let metadata = null;
    try {
      metadata = parseMetadata(formData.metadataText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      return null;
    }

    return {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim() ? formData.phone.trim() : null,
      email: formData.email.trim() ? formData.email.trim() : null,
      status: formData.status.trim() || "active",
      occupationId: formData.occupationId ? formData.occupationId : null,
      keycloakUserId: formData.keycloakUserId.trim() ? formData.keycloakUserId.trim() : null,
      metadata,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;
    const payload = buildPayload();
    if (!payload) return;
    if (!payload.fullName) {
      toast.error("Full name is required.");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && customerId) {
        await updateCustomer(customerId, payload);
        toast.success("Customer updated.");
      } else {
        await createCustomer(payload);
        toast.success("Customer created.");
      }
      navigate("/customer");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isView || submitting || entityLoading || occLoading;
  const showSkeleton = Boolean(customerId) && entityLoading;

  const title =
    isView ? "View Customer" : isEdit ? "Edit Customer" : "Add Customer";

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>{title}</h4>
      </div>
      <div className='card-body p-24'>
        {loadError && customerId && !showSkeleton && (
          <div className='alert alert-danger radius-12 mb-16' role='alert'>
            {loadError}
          </div>
        )}
        {showSkeleton ? (
          <p className='text-secondary-light mb-0'>Loading customer...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className='row'>
              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                  Full name <span className='text-danger-600'>*</span>
                </label>
                <input
                  type='text'
                  className='form-control radius-8'
                  name='fullName'
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={disabled}
                  maxLength={255}
                />
              </div>
              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Phone</label>
                <input
                  type='text'
                  className='form-control radius-8'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={disabled}
                  maxLength={32}
                />
              </div>
              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Email</label>
                <input
                  type='email'
                  className='form-control radius-8'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  disabled={disabled}
                  maxLength={255}
                />
              </div>
              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Status</label>
                <input
                  type='text'
                  className='form-control radius-8'
                  name='status'
                  value={formData.status}
                  onChange={handleChange}
                  disabled={disabled}
                  maxLength={32}
                />
              </div>
              <div className='col-md-6 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Occupation</label>
                <select
                  className='form-control radius-8 form-select'
                  name='occupationId'
                  value={formData.occupationId}
                  onChange={handleChange}
                  disabled={disabled}
                >
                  <option value=''>None</option>
                  {occupations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || "—"}
                    </option>
                  ))}
                </select>
              </div>
              <div className='col-md-12 mb-20'>
                <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                  Metadata (JSON)
                </label>
                <textarea
                  className='form-control radius-8 text-sm'
                  style={{ fontFamily: "monospace" }}
                  name='metadataText'
                  rows={4}
                  value={formData.metadataText}
                  onChange={handleChange}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className='d-flex align-items-center justify-content-between mt-24'>
              <button
                type='button'
                onClick={() => navigate(-1)}
                className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
              >
                <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
              </button>
              {!isView && (
                <button
                  type='submit'
                  disabled={disabled}
                  className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
                >
                  <Icon icon='lucide:save' className='text-xl' />{" "}
                  {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerFormLayer;
