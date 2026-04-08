import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const BannerFormLayer = ({ isEdit = false, isView = false, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData || {
      bannerRoute: "",
      availability: "",
      bannerType: "",
      broadcastApplication: "",
      bannerPlacement: "",
      redirectUrl: "",
      banner: null,
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
    console.log(isEdit ? "Updating Banner:" : "Adding Banner:", formData);
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Banner" : isEdit ? "Edit Banner" : "Add Banner"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            
            {/* Banner Route */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Banner Route <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='bannerRoute' value={formData.bannerRoute} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='MAIN_SCREEN'>MAIN_SCREEN</option>
                <option value='HOME'>HOME</option>
                <option value='NEWS_FEED'>NEWS_FEED</option>
                <option value='WALLET'>WALLET</option>
                <option value='PROFILE'>PROFILE</option>
                <option value='ABOUT_NEWS_FEED'>ABOUT_NEWS_FEED</option>
              </select>
            </div>

            {/* Availability */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Availability <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='availability' value={formData.availability} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='Yes'>Yes</option>
                <option value='No'>No</option>
              </select>
            </div>

            {/* Banner Type */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Banner Type <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='bannerType' value={formData.bannerType} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='IMAGE'>IMAGE</option>
                <option value='VIDEO'>VIDEO</option>
              </select>
            </div>

            {/* Broadcast Application */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Broadcast Application <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='broadcastApplication' value={formData.broadcastApplication} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='VENDOR'>VENDOR</option>
                <option value='CUSTOMER'>CUSTOMER</option>
                <option value='BOTH'>BOTH</option>
              </select>
            </div>

            {/* Banner Placement */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Banner Placement <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='bannerPlacement' value={formData.bannerPlacement} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='TOP'>TOP</option>
                <option value='MIDDLE'>MIDDLE</option>
                <option value='BOTTOM'>BOTTOM</option>
              </select>
            </div>

            {/* Redirect Url */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Redirect Url <span className='text-danger-600'>*</span>
              </label>
              <input type='url' className='form-control radius-8' name='redirectUrl' placeholder="https://..." value={formData.redirectUrl} onChange={handleChange} required disabled={isView} />
            </div>

            {/* Banner Upload */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Banner <span className='text-danger-600'>*</span>
              </label>
              <input type='file' className='form-control radius-8' name='banner' onChange={handleFileChange} required={!isEdit && !isView} disabled={isView} accept="image/*,video/*" />
              {isView && (
                <div className="mt-12">
                   <span className="text-sm text-primary-600 fw-medium cursor-pointer d-flex align-items-center gap-2">
                       <Icon icon="mdi:image-outline" className="text-xl" /> View Current Banner File
                   </span>
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className='d-flex align-items-center justify-content-between mt-24'>
            <button type='button' onClick={() => window.history.back()} className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
              <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
            </button>
            
            {!isView && (
              <button type='submit' className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
                <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update Banner" : "Save Banner"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default BannerFormLayer;