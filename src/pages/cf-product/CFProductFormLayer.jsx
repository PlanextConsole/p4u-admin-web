import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const CFProductFormLayer = ({ isEdit = false, isView = false, initialData = null, onSuccess, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isView) return;
    if (onSuccess) onSuccess();
  };
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      availability: "Yes",
      vendor: "",
      category: "",
      services: "",
      sellPrice: "",
      description: "",
      image: null,
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

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View CF Product" : isEdit ? "Edit CF Product" : "Add CF Product"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            {/* Product Name */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Name <span className='text-danger-600'>*</span></label>
              <input type='text' className='form-control radius-8' name='name' value={formData.name} onChange={handleChange} required disabled={isView} placeholder="Enter product name" />
            </div>

            {/* Availability */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Availability <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='availability' value={formData.availability} onChange={handleChange} required disabled={isView}>
                <option value='Yes'>Yes</option>
                <option value='No'>No</option>
              </select>
            </div>

            {/* Vendor */}
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Vendor <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='vendor' value={formData.vendor} onChange={handleChange} required disabled={isView}>
                <option value=''>Select Vendor...</option>
                <option value='V1'>Sai Muruga Traders</option>
                <option value='V2'>Rahul Farms</option>
              </select>
            </div>

            {/* Category */}
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Category <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='category' value={formData.category} onChange={handleChange} required disabled={isView}>
                <option value=''>Select Category...</option>
                <option value='C1'>Groceries</option>
                <option value='C2'>Electronics</option>
              </select>
            </div>

            {/* Services */}
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Services <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='services' value={formData.services} onChange={handleChange} required disabled={isView}>
                <option value=''>Select Service...</option>
                <option value='S1'>Delivery Only</option>
                <option value='S2'>Installation Included</option>
              </select>
            </div>

            {/* Sell Price */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Sell Price <span className='text-danger-600'>*</span></label>
              <div className="input-group">
                <span className="input-group-text bg-base radius-8-start">₹</span>
                <input type='number' className='form-control radius-8-end' name='sellPrice' value={formData.sellPrice} onChange={handleChange} required disabled={isView} placeholder="0.00" />
              </div>
            </div>

            {/* Description */}
            <div className='col-12 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Description</label>
              <textarea className='form-control radius-8' name='description' rows="3" value={formData.description} onChange={handleChange} disabled={isView} placeholder="Detailed product specifications..."></textarea>
            </div>

            {/* Main Image */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Image</label>
              <input type='file' className='form-control radius-8' name='image' onChange={handleFileChange} disabled={isView} />
            </div>

            {/* Thumbnail */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Thumbnail <span className='text-danger-600'>*</span></label>
              <input type='file' className='form-control radius-8' name='thumbnail' onChange={handleFileChange} required={!isEdit && !isView} disabled={isView} />
            </div>
          </div>

          <div className='d-flex align-items-center justify-content-between mt-24'>
            <button type='button' onClick={() => (onCancel ? onCancel() : window.history.back())} className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
              <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
            </button>
            {!isView && (
              <button type='submit' className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
                <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update Product" : "Save Product"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CFProductFormLayer;