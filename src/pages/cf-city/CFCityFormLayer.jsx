import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const CFCityFormLayer = ({ isEdit = false, isView = false, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData || {
      cityName: "",
      description: "",
      icon: null,
    }
  );

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (isView) return;
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isView) return;
    console.log(isEdit ? "Updating CF City:" : "Adding CF City:", formData);
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View City" : isEdit ? "Edit City" : "Add City"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            
            {/* City Name */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                City Name <span className='text-danger-600'>*</span>
              </label>
              <input 
                type='text' 
                className='form-control radius-8' 
                name='cityName' 
                placeholder="e.g., Chennai, Bangalore"
                value={formData.cityName} 
                onChange={handleChange} 
                required 
                disabled={isView} 
              />
            </div>

            {/* Icon */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Icon <span className='text-danger-600'>*</span>
              </label>
              <input 
                type='file' 
                className='form-control radius-8' 
                name='icon' 
                onChange={handleFileChange} 
                required={!isEdit && !isView} 
                disabled={isView} 
                accept="image/*" 
              />
              {isView && (
                <div className="mt-12">
                   <span className="text-sm text-primary-600 fw-medium cursor-pointer d-flex align-items-center gap-2">
                       <Icon icon="mdi:image-outline" className="text-xl" /> View City Icon
                   </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className='col-md-12 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Description <span className='text-danger-600'>*</span>
              </label>
              <textarea 
                className='form-control radius-8' 
                name='description' 
                rows="4"
                placeholder="Enter details about this city..."
                value={formData.description} 
                onChange={handleChange} 
                required 
                disabled={isView} 
              ></textarea>
            </div>

          </div>

          {/* Action Buttons */}
          <div className='d-flex align-items-center justify-content-between mt-24'>
            <button 
              type='button' 
              onClick={() => window.history.back()} 
              className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
            >
              <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
            </button>
            
            {!isView && (
              <button 
                type='submit' 
                className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
              >
                <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update City" : "Save City"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default CFCityFormLayer;