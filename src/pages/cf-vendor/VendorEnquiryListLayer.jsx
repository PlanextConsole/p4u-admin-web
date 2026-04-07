import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialEnquiries = [
  { id: 1, area: "White Town", description: "Looking to register a new cafe.", icon: "assets/images/icons/cafe.png", city: "Pondicherry", pincode: "605001" },
  { id: 2, area: "Kalamassery", description: "Enquiry for electronics repair service listing.", icon: "assets/images/icons/repair.png", city: "Kochi", pincode: "682033" },
];

const VendorEnquiryListLayer = () => {
  const [enquiries, setEnquiries] = useState(initialEnquiries);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      setEnquiries(enquiries.filter((e) => e.id !== id));
    }
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
        <div className='d-flex align-items-center flex-wrap gap-3'>
          <span className='text-md fw-medium text-secondary-light mb-0'>Show</span>
          <select className='form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px' defaultValue='10'>
            <option value='10'>10</option>
            <option value='20'>20</option>
          </select>
          <form className='navbar-search'>
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Enquiries...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>Sr No.</th>
                <th scope='col'>Area</th>
                <th scope='col'>Description</th>
                <th scope='col'>Icon</th>
                <th scope='col'>City</th>
                <th scope='col'>Pincode</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td><span className='fw-medium text-primary-light'>{item.area}</span></td>
                  <td><span className="text-secondary-light text-truncate d-inline-block" style={{ maxWidth: '250px' }}>{item.description}</span></td>
                  <td><img src={item.icon} alt="Icon" className="w-40-px h-40-px radius-8 object-fit-cover" /></td>
                  <td>{item.city}</td>
                  <td>{item.pincode}</td>
                  <td className='text-center'>
                    <div className='d-flex align-items-center gap-10 justify-content-center'>
                      <button onClick={() => handleDelete(item.id)} className='bg-danger-focus text-danger-600 w-32-px h-32-px d-flex justify-content-center align-items-center rounded-circle'><Icon icon='fluent:delete-24-regular' /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorEnquiryListLayer;