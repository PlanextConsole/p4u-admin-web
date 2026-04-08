import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const AdvertisementFormLayer = ({ isEdit = false, isView = false, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData || {
      advertisementName: "",
      caption: "",
      buttonTitle: "",
      redirectUrl: "",
      orderOfAppearance: "",
      availability: "",
      postType: "",
      logoImage: null,
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
    console.log(isEdit ? "Updating Advertisement:" : "Adding Advertisement:", formData);
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Advertisement" : isEdit ? "Edit Advertisement" : "Add Advertisement"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            
            {/* Advertisement Name */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Advertisement Name <span className='text-danger-600'>*</span>
              </label>
              <input type='text' className='form-control radius-8' name='advertisementName' value={formData.advertisementName} onChange={handleChange} required disabled={isView} />
            </div>

            {/* Caption */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Caption <span className='text-danger-600'>*</span>
              </label>
              <input type='text' className='form-control radius-8' name='caption' value={formData.caption} onChange={handleChange} required disabled={isView} />
            </div>

            {/* Button Title */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Button Title <span className='text-danger-600'>*</span>
              </label>
              <input type='text' className='form-control radius-8' name='buttonTitle' placeholder="e.g., Shop Now" value={formData.buttonTitle} onChange={handleChange} required disabled={isView} />
            </div>

            {/* Redirect Url */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Redirect Url <span className='text-danger-600'>*</span>
              </label>
              <input type='url' className='form-control radius-8' name='redirectUrl' placeholder="https://..." value={formData.redirectUrl} onChange={handleChange} required disabled={isView} />
            </div>

            {/* Order Of Appearance */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Order Of Appearance <span className='text-danger-600'>*</span>
              </label>
              <input type='number' className='form-control radius-8' name='orderOfAppearance' value={formData.orderOfAppearance} onChange={handleChange} required disabled={isView} />
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

            {/* Post Type */}
            <div className='col-md-12 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Post Type <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='postType' value={formData.postType} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='Image'>Image</option>
                <option value='Video'>Video</option>
                <option value='Text'>Text</option>
              </select>
            </div>

            {/* Logo Image */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Logo Image <span className='text-danger-600'>*</span>
              </label>
              <input type='file' className='form-control radius-8' name='logoImage' onChange={handleFileChange} required={!isEdit && !isView} disabled={isView} accept="image/*" />
              {isView && (
                <div className="mt-12">
                   <span className="text-sm text-primary-600 fw-medium cursor-pointer d-flex align-items-center gap-2">
                       <Icon icon="mdi:image-outline" className="text-xl" /> View Logo
                   </span>
                </div>
              )}
            </div>

            {/* Banner */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Banner <span className='text-danger-600'>*</span>
              </label>
              <input type='file' className='form-control radius-8' name='banner' onChange={handleFileChange} required={!isEdit && !isView} disabled={isView} accept="image/*,video/*" />
              {isView && (
                <div className="mt-12">
                   <span className="text-sm text-primary-600 fw-medium cursor-pointer d-flex align-items-center gap-2">
                       <Icon icon="mdi:image-multiple-outline" className="text-xl" /> View Banner
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
                <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update" : "Save"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdvertisementFormLayer;