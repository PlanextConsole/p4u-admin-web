import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const CFVendorFormLayer = ({ isEdit = false, isView = false, initialData = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      businessName: "",
      areaName: "",
      gst: "",
      mobileNumber: "",
      businessPhone: "",
      email: "",
      status: "Active",
      experience: "",
      aboutBusiness: "",
      address: "",
      categories: "",
      services: "",
      logo: null,
      banner: null,
    }
  );

  const [businessHours, setBusinessHours] = useState({
    Sunday: { open: "", close: "" },
    Monday: { open: "", close: "" },
    Tuesday: { open: "", close: "" },
    Wednesday: { open: "", close: "" },
    Thursday: { open: "", close: "" },
    Friday: { open: "", close: "" },
    Saturday: { open: "", close: "" },
  });

  const handleChange = (e) => {
    if (isView) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHourChange = (day, field, value) => {
    if (isView) return;
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
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
    console.log(isEdit ? "Updating CF Vendor:" : "Adding CF Vendor:", formData, businessHours);
    if (onSuccess) onSuccess();
  };

  const categoryOptions = [
    "Event Organisers", "Books Sports Hobbies", "Electronics", "Fashion Beauty", 
    "Furniture Household", "Health Fitness", "Kids Equipments", "Pet Animals", 
    "Photography", "Real Estate", "Movers & Packers", "Restaurants Cafe", 
    "Travel Tours", "Matrimonials", "Jobs", "Gym", "Gym2", "Tailors", 
    "Tutors", "Construction", "Digital Marketing in IT field", "Electronic Devices"
  ];

  const areaOptions = [
    "White Town", "Vambakeerapalayam", "Sowri Palayam", "Pollachi", 
    "Mudaliarpet", "Kalamassery", "Kakkanad", "Edappally", "Old Vellore"
  ];

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24'>
        <h4 className='text-lg fw-semibold mb-0'>
          {isView ? "View Vendor" : isEdit ? "Edit Vendor" : "Add Vendor"}
        </h4>
      </div>
      <div className='card-body p-24'>
        <form onSubmit={handleSubmit}>
          
          {/* SECTION 1: Service Provider Information */}
          <h6 className="text-md fw-bold mb-16 text-primary-600 border-bottom pb-8">Service Provider Information</h6>
          <div className='row mb-24'>
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Name <span className='text-danger-600'>*</span></label>
              <input type='text' className='form-control radius-8' name='name' value={formData.name} onChange={handleChange} required disabled={isView} />
            </div>
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Business Name <span className='text-danger-600'>*</span></label>
              <input type='text' className='form-control radius-8' name='businessName' value={formData.businessName} onChange={handleChange} required disabled={isView} />
            </div>
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Area Name <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='areaName' value={formData.areaName} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                {areaOptions.map((area, i) => <option key={i} value={area}>{area}</option>)}
              </select>
            </div>

            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>GST <span className='text-danger-600'>*</span></label>
              <input type='text' className='form-control radius-8' name='gst' value={formData.gst} onChange={handleChange} required disabled={isView} />
            </div>
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Mobile Number <span className='text-danger-600'>*</span></label>
              <input type='text' className='form-control radius-8' name='mobileNumber' value={formData.mobileNumber} onChange={handleChange} required disabled={isView} />
            </div>
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Business Phone Number <span className='text-danger-600'>*</span></label>
              <input type='text' className='form-control radius-8' name='businessPhone' value={formData.businessPhone} onChange={handleChange} required disabled={isView} />
            </div>

            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Email <span className='text-danger-600'>*</span></label>
              <input type='email' className='form-control radius-8' name='email' value={formData.email} onChange={handleChange} required disabled={isView} />
            </div>
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Status <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='status' value={formData.status} onChange={handleChange} required disabled={isView}>
                <option value='Active'>Active</option>
                <option value='Inactive'>Inactive</option>
              </select>
            </div>
            <div className='col-md-4 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Experience (Years) <span className='text-danger-600'>*</span></label>
              <input type='number' className='form-control radius-8' name='experience' value={formData.experience} onChange={handleChange} required disabled={isView} />
            </div>

            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Logo</label>
              <input type='file' className='form-control radius-8' name='logo' onChange={handleFileChange} disabled={isView} accept="image/*" />
            </div>
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Banners Image</label>
              <input type='file' className='form-control radius-8' name='banner' onChange={handleFileChange} disabled={isView} accept="image/*" />
            </div>

            <div className='col-md-12 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>About Business</label>
              <textarea className='form-control radius-8' name='aboutBusiness' rows="3" value={formData.aboutBusiness} onChange={handleChange} disabled={isView}></textarea>
            </div>
          </div>

          {/* SECTION 2: Business Hours */}
          <h6 className="text-md fw-bold mb-16 text-primary-600 border-bottom pb-8">Business Hours</h6>
          <div className='row mb-24'>
            {Object.keys(businessHours).map((day) => (
              <div className='col-md-6 col-lg-4 mb-16' key={day}>
                <label className='form-label fw-semibold text-secondary-light text-sm mb-4'>{day}</label>
                <div className='d-flex align-items-center gap-2'>
                  <input type='time' className='form-control form-control-sm radius-8' value={businessHours[day].open} onChange={(e) => handleHourChange(day, 'open', e.target.value)} disabled={isView} />
                  <span>to</span>
                  <input type='time' className='form-control form-control-sm radius-8' value={businessHours[day].close} onChange={(e) => handleHourChange(day, 'close', e.target.value)} disabled={isView} />
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 3: Address Information */}
          <h6 className="text-md fw-bold mb-16 text-primary-600 border-bottom pb-8">Service Provider Address Information</h6>
          <div className='row mb-24'>
            <div className='col-md-12 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Address <span className='text-danger-600'>*</span></label>
              <textarea className='form-control radius-8' name='address' rows="2" value={formData.address} onChange={handleChange} required disabled={isView}></textarea>
            </div>
          </div>

          {/* SECTION 4: Category/Service Information */}
          <h6 className="text-md fw-bold mb-16 text-primary-600 border-bottom pb-8">Service Provider Category/Service Information</h6>
          <div className='row mb-24'>
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Add Categories <span className='text-danger-600'>*</span></label>
              <select className='form-control radius-8 form-select' name='categories' value={formData.categories} onChange={handleChange} required disabled={isView}>
                <option value=''>Select...</option>
                {categoryOptions.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className='col-md-6 mb-20'>
              <label className='form-label fw-semibold text-primary-light text-sm mb-8'>Add Services <span className='text-danger-600'>*</span></label>
              <input type='text' className='form-control radius-8' name='services' placeholder="e.g. Deep Cleaning, AC Repair" value={formData.services} onChange={handleChange} required disabled={isView} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='d-flex align-items-center justify-content-between mt-24'>
            <button type='button' onClick={() => (onCancel ? onCancel() : window.history.back())} className='btn border border-danger-600 text-danger-600 bg-hover-danger-200 text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
              <Icon icon='mdi:close-circle-outline' className='text-xl' /> {isView ? "Back" : "Cancel"}
            </button>
            
            {!isView && (
              <button type='submit' className='btn btn-primary text-md px-56 py-12 radius-8 d-flex align-items-center gap-2'>
                <Icon icon='lucide:save' className='text-xl' /> {isEdit ? "Update Vendor" : "Save Vendor"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default CFVendorFormLayer;