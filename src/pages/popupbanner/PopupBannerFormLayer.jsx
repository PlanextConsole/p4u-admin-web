import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const PopupBannerFormLayer = ({ isEdit = false, isView = false, initialData = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      appType: "",
      screenId: "",
      active: "",
      popupImage: null,
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
    console.log(isEdit ? "Updating Popup Banner:" : "Adding Popup Banner:", formData);
    if (onSuccess) onSuccess();
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Popup Banner" : isEdit ? "Edit Popup Banner" : "Add Popup Banner"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            
            {/* App Type */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                App Type <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='appType' value={formData.appType} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='User'>User</option>
                <option value='Vendor'>Vendor</option>
              </select>
            </div>

            {/* Screen Id */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Screen Id <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='screenId' value={formData.screenId} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='Splash Screen'>Splash Screen</option>
                <option value='Menu'>Menu</option>
                <option value='Social media'>Social media</option>
                <option value='Services'>Services</option>
                <option value='Newsfeed'>Newsfeed</option>
                <option value='Wallets'>Wallets</option>
                <option value='Profile'>Profile</option>
              </select>
            </div>

            {/* Active */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Active <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='active' value={formData.active} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='Active'>Active</option>
                <option value='Deactive'>Deactive</option>
              </select>
            </div>

            {/* Popup Banners Image */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Popup Banners Image <span className='text-danger-600'>*</span>
              </label>
              <input type='file' className='form-control radius-8' name='popupImage' onChange={handleFileChange} required={!isEdit && !isView} disabled={isView} accept="image/*" />
              {isView && (
                <div className="mt-12">
                   <span className="text-sm text-primary-600 fw-medium cursor-pointer d-flex align-items-center gap-2">
                       <Icon icon="mdi:image-outline" className="text-xl" /> View Image
                   </span>
                </div>
              )}
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
                <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update Banner" : "Save Banner"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default PopupBannerFormLayer;