import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const SettlementFormLayer = ({ isView = false, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData || {
      vendorName: "Sai Muruga Traders",
      vendorMobile: "+916381725188",
      paymentMode: "UPI",
      transactionId: "pay_SY70v9ABFapkXU",
      picture: null,
      settlementType: "Vendors",
      amount: "105",
    }
  );

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Settlement" : "Settlement Details"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form>
          <div className='row'>
            
            {/* Vendor Name */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Vendor</label>
              <input type='text' className='form-control radius-8 bg-neutral-100' name='vendorName' value={formData.vendorName} readOnly disabled={isView} />
            </div>

            {/* Vendor Mobile */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Vendor Mobile</label>
              <input type='text' className='form-control radius-8 bg-neutral-100' name='vendorMobile' value={formData.vendorMobile} readOnly disabled={isView} />
            </div>

            {/* Payment Mode */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Select Payment Mode <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='paymentMode' value={formData.paymentMode} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='UPI'>UPI</option>
                <option value='Net Banking'>Net Banking</option>
                <option value='Cash'>Cash</option>
                <option value='Debit Card'>Debit Card</option>
                <option value='Credit Card'>Credit Card</option>
              </select>
            </div>

            {/* Transaction ID */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Transaction ID <span className='text-danger-600'>*</span></label>
              <input type='text' className='form-control radius-8' name='transactionId' value={formData.transactionId} onChange={handleChange} required disabled={isView} />
            </div>

            {/* Settlement Type */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Settlement Type <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='settlementType' value={formData.settlementType} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                <option value='Vendors'>Vendors</option>
                <option value='Customers'>Customers</option>
              </select>
            </div>

            {/* Amount */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Amount <span className='text-danger-600'>*</span></label>
              <input type='number' className='form-control radius-8' name='amount' value={formData.amount} onChange={handleChange} required disabled={isView} />
            </div>

            {/* Picture */}
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Picture <span className='text-danger-600'>*</span></label>
              <input type='file' className='form-control radius-8' name='picture' disabled={isView} />
              {isView && (
                  <div className="mt-12">
                      <span className="text-sm text-primary-600 fw-medium cursor-pointer d-flex align-items-center gap-2">
                          <Icon icon="mdi:image-outline" className="text-xl" /> View Attached Receipt
                      </span>
                  </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className='d-flex align-items-center justify-content-end mt-24'>
            <button type='button' onClick={() => window.history.back()} className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
              <Icon icon='mdi:arrow-left-circle-outline' className='text-xl' /> Back
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SettlementFormLayer;