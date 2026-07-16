import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { createAvailableArea, updateAvailableArea } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const empty = () => ({
  name: "",
  cityId: "",
  postalCode: "",
  isActive: true,
});

const CFAreaFormLayer = ({ isEdit = false, isView = false, initialData = null, cities = [], onSuccess, onCancel }) => {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialData ? {
      name: initialData.name || "",
      cityId: initialData.cityId || "",
      postalCode: initialData.postalCode || "",
      isActive: initialData.isActive !== false,
    } : empty());
  }, [initialData]);

  const handleChange = (event) => {
    if (isView) return;
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isView) return;
    const name = form.name.trim();
    if (!name) return toast.error("Area name is required.");
    if (!form.cityId) return toast.error("Please select a city.");

    const body = {
      name,
      cityId: form.cityId,
      postalCode: form.postalCode.trim() || null,
      isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      if (isEdit && initialData?.id) {
        await updateAvailableArea(initialData.id, body);
        toast.success("Area updated.");
      } else {
        await createAvailableArea(body);
        toast.success("Area created.");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isView || submitting;

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Area" : isEdit ? "Edit Area" : "Add Area"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Area Name <span className='text-danger-600'>*</span>
              </label>
              <input type='text' className='form-control radius-8' name='name' value={form.name} onChange={handleChange} disabled={disabled} maxLength={255} required />
            </div>
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                City <span className='text-danger-600'>*</span>
              </label>
              <select className='form-select radius-8' name='cityId' value={form.cityId} onChange={handleChange} disabled={disabled} required>
                <option value=''>Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}{city.stateName ? ` — ${city.stateName}` : ""}</option>
                ))}
              </select>
              {!cities.length && <div className='text-danger-600 text-xs mt-4'>Create a city before adding an area.</div>}
            </div>
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Postal Code</label>
              <input type='text' className='form-control radius-8' name='postalCode' value={form.postalCode} onChange={handleChange} disabled={disabled} maxLength={32} />
            </div>
            <div className='col-md-6 mb-20 d-flex align-items-end'>
              <div className='form-check mb-10'>
                <input type='checkbox' className='form-check-input' id='area-active' name='isActive' checked={form.isActive} onChange={handleChange} disabled={disabled} />
                <label className='form-check-label' htmlFor='area-active'>Active</label>
              </div>
            </div>
          </div>
          <div className='d-flex align-items-center justify-content-between mt-24'>
            <button type='button' onClick={onCancel} className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
              <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
            </button>
            {!isView && (
              <button type='submit' disabled={disabled || !cities.length} className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
                <Icon icon='lucide:save' className='text-xl' />
                {submitting ? "Saving..." : isEdit ? "Update Area" : "Save Area"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CFAreaFormLayer;
