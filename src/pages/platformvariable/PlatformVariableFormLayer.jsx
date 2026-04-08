import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const PlatformVariableFormLayer = ({ isEdit = false, isView = false, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData || {
      variableType: "",
      currencyType: "",
      valueType: "",
      value: "",
      description: "",
    }
  );

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isView) return;
    console.log(isEdit ? "Updating Platform Variable:" : "Adding Platform Variable:", formData);
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Platform Variable" : isEdit ? "Edit Platform Variable" : "Add Platform Variable"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          <div className='row'>
            
            {/* Variable Type */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Variable Type <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='variableType' value={formData.variableType} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='PLATFORM_FEE'>PLATFORM_FEE</option>
                <option value='VENDOR_PENALTY'>VENDOR_PENALTY</option>
                <option value='CUSTOMER_PENALTY'>CUSTOMER_PENALTY</option>
                <option value='WELCOME_BONUS'>WELCOME_BONUS</option>
                <option value='WELCOME_BONUS_AMOUNT'>WELCOME_BONUS_AMOUNT</option>
                <option value='WELCOME_BONUS_MIN_ORDER_VALUE'>WELCOME_BONUS_MIN_ORDER_VALUE</option>
                <option value='REFERRAL_BONUS'>REFERRAL_BONUS</option>
                <option value='VENDOR_REFERRAL_BONUS'>VENDOR_REFERRAL_BONUS</option>
                <option value='BONUS_PER_LIKES'>BONUS_PER_LIKES</option>
                <option value='BONUS_PER_VIEWS'>BONUS_PER_VIEWS</option>
                <option value='BONUS_PER_SHARES'>BONUS_PER_SHARES</option>
                <option value='POINTS_PER_RUPPEE'>POINTS_PER_RUPPEE</option>
                <option value='ADVERTISEMENT_PER_POSTS'>ADVERTISEMENT_PER_POSTS</option>
                <option value='BRONZE_CUT'>BRONZE_CUT</option>
                <option value='SILVER_CUT'>SILVER_CUT</option>
                <option value='GOLD_CUT'>GOLD_CUT</option>
                <option value='PLATINUM_CUT'>PLATINUM_CUT</option>
                <option value='POINTS_VALIDITY'>POINTS_VALIDITY</option>
              </select>
            </div>

            {/* Currency Type */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Currency Type <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='currencyType' value={formData.currencyType} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='Ruppees'>Ruppees</option>
                <option value='Points'>Points</option>
                <option value='None'>None</option>
              </select>
            </div>

            {/* Value Type */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Value Type <span className='text-danger-600'>*</span>
              </label>
              <select className='form-control radius-8 form-select' name='valueType' value={formData.valueType} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='FLAT'>FLAT</option>
                <option value='PERCENTAGE'>PERCENTAGE</option>
                <option value='TEXT'>TEXT</option>
              </select>
            </div>

            {/* Value */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Value {formData.currencyType === 'Ruppees' ? '(₹)' : formData.currencyType === 'Points' ? '(Pts)' : ''} <span className='text-danger-600'>*</span>
              </label>
              <input type={formData.valueType === 'TEXT' ? 'text' : 'number'} className='form-control radius-8' name='value' value={formData.value} onChange={handleChange} required disabled={isView} placeholder="Enter value..." />
            </div>

            {/* Description */}
            <div className='col-md-12 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>
                Description <span className='text-danger-600'>*</span>
              </label>
              <textarea className='form-control radius-8' name='description' rows="3" value={formData.description} onChange={handleChange} required disabled={isView} placeholder="Explain the purpose of this variable..."></textarea>
            </div>

          </div>

          {/* Action Buttons */}
          <div className='d-flex align-items-center justify-content-between mt-24'>
            <button type='button' onClick={() => window.history.back()} className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
              <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
            </button>
            
            {!isView && (
              <button type='submit' className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
                <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update Variable" : "Save Variable"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default PlatformVariableFormLayer;