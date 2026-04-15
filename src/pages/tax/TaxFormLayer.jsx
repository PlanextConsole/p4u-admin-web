import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const TaxFormLayer = ({ isEdit = false, isView = false, initialData = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      servicesType: "",
      rate: "",
      description: "",
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isEdit ? "Updating Tax:" : "Adding Tax:", formData);
    if (onSuccess) onSuccess();
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isEdit ? "Edit Tax" : "Add Tax"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            
            {/* Services Type */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Services Type <span className='text-danger-600'>*</span>
              </label>
              <select 
                className='form-control radius-8 form-select' 
                name='servicesType' 
                value={formData.servicesType} 
                onChange={handleChange} 
                required
              >
                <option value=''>Select Services Type...</option>
                <option value='Cleaning Service'>Cleaning Service</option>
                <option value='Nail Arts'>Nail Arts</option>
                <option value='Bio Enzyme'>Bio Enzyme</option>
                <option value='Zero Rate'>Zero Rate</option>
                <option value='Standard Rate'>Standard Rate</option>
              </select>
            </div>

            {/* Rate */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Rate (%) <span className='text-danger-600'>*</span>
              </label>
              <input 
                type='number' 
                className='form-control radius-8' 
                name='rate' 
                placeholder="e.g. 18"
                value={formData.rate} 
                onChange={handleChange} 
                required 
              />
            </div>

            {/* Description */}
            <div className='col-md-12 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Description
              </label>
              <textarea 
                className='form-control radius-8' 
                name='description' 
                rows="4" 
                placeholder="Enter tax description here..."
                value={formData.description} 
                onChange={handleChange}
              ></textarea>
            </div>

          </div>

          {/* Action Buttons */}
          <div className='d-flex align-items-center justify-content-between mt-24'>
            <button 
              type='button' 
              onClick={() => (onCancel ? onCancel() : window.history.back())}
              className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
            >
              <Icon icon='mdi:close-circle-outline' className='text-xl' /> Cancel
            </button>
            
            <button 
              type='submit' 
              className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
            >
              <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update Tax" : "Save Tax"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TaxFormLayer;