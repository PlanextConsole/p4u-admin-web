import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const CFServiceFormLayer = ({ isEdit = false, isView = false, initialData = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      categories: "",
      availability: "Active",
      description: "",
      thumbnail: null,
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
    console.log(isEdit ? "Updating CF Service:" : "Adding CF Service:", formData);
    if (onSuccess) onSuccess();
  };

  const categoryOptions = [
    "Event Organisers", "Books Sports Hobbies", "Electronics", "Fashion Beauty", 
    "Furniture Household", "Health Fitness", "Kids Equipments", "Pet Animals", 
    "Photography", "Real Estate", "Movers & Packers", "Restaurants Cafe", 
    "Travel Tours", "Matrimonials", "Jobs", "Gym", "Gym2", "Tailors", 
    "Tutors", "Construction", "Digital Marketing  in IT field", "Electronic Devices"
  ];

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View CF Service" : isEdit ? "Edit CF Service" : "Add CF Service"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            
            {/* Name */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Name <span className='text-danger-600'>*</span>
              </label>
              <input 
                type='text' 
                className='form-control radius-8' 
                name='name' 
                placeholder="e.g., Deep House Cleaning"
                value={formData.name} 
                onChange={handleChange} 
                required 
                disabled={isView} 
              />
            </div>

            {/* Categories */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Add Categories <span className='text-danger-600'>*</span>
              </label>
              <select 
                className='form-control radius-8 form-select' 
                name='categories' 
                value={formData.categories} 
                onChange={handleChange} 
                required 
                disabled={isView}
              >
                <option value=''>Select...</option>
                {categoryOptions.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Availability <span className='text-danger-600'>*</span>
              </label>
              <select 
                className='form-control radius-8 form-select' 
                name='availability' 
                value={formData.availability} 
                onChange={handleChange} 
                required 
                disabled={isView}
              >
                <option value='Active'>Active</option>
                <option value='Inactive'>Inactive</option>
              </select>
            </div>

            {/* Thumbnail */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Thumbnail <span className='text-danger-600'>*</span>
              </label>
              <input 
                type='file' 
                className='form-control radius-8' 
                name='thumbnail' 
                onChange={handleFileChange} 
                required={!isEdit && !isView} 
                disabled={isView} 
                accept="image/*" 
              />
              {isView && (
                <div className="mt-12">
                   <span className="text-sm text-primary-600 fw-medium cursor-pointer d-flex align-items-center gap-2">
                       <Icon icon="mdi:image-outline" className="text-xl" /> View Thumbnail
                   </span>
                </div>
              )}
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
                placeholder="Enter details about this service..."
                value={formData.description} 
                onChange={handleChange} 
                disabled={isView} 
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
              <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
            </button>
            
            {!isView && (
              <button 
                type='submit' 
                className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'
              >
                <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update Service" : "Save Service"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default CFServiceFormLayer;