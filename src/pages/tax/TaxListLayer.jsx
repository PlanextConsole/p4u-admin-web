import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialTaxes = [
  {
    id: 1,
    servicesType: "Standard Rate",
    rate: "18%",
    description: "Standard GST applied to most services and products.",
  },
  {
    id: 2,
    servicesType: "Zero Rate",
    rate: "0%",
    description: "Tax exemption applied to specific organic products.",
  },
  {
    id: 3,
    servicesType: "Cleaning Service",
    rate: "12%",
    description: "Specific tax rate applied to residential cleaning services.",
  }
];

const TaxListLayer = () => {
  const [taxes, setTaxes] = useState(initialTaxes);

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this tax rate?");
    if (confirmDelete) {
      setTaxes(taxes.filter((tax) => tax.id !== id));
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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Tax...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <Link to='/add-tax' className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add Tax
        </Link>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0'>
            <thead>
              <tr>
                <th scope='col'>S.No</th>
                <th scope='col'>Services Type</th>
                <th scope='col'>Rate</th>
                <th scope='col'>Description</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {taxes.length > 0 ? (
                taxes.map((tax, index) => (
                  <tr key={tax.id}>
                    <td>{index + 1}</td>
                    <td className="fw-medium text-primary-light">{tax.servicesType}</td>
                    <td>
                      <span className="bg-info-focus text-info-600 px-12 py-4 radius-4 fw-bold text-sm">
                        {tax.rate}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary-light">{tax.description}</span>
                    </td>
                    <td className='text-center'>
                      <div className='d-flex align-items-center gap-10 justify-content-center'>
                        <Link to={`/edit-tax/${tax.id}`} className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Edit">
                          <Icon icon='lucide:edit' className='menu-icon' />
                        </Link>
                        <button type='button' onClick={() => handleDelete(tax.id)} className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Delete">
                          <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">No tax records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Details */}
        <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
          <span>Showing 1 to {taxes.length} of {taxes.length} entries</span>
          <ul className='pagination d-flex flex-wrap align-items-center gap-2 justify-content-center'>
            <li className='page-item'>
              <Link className='page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md' to='#'>
                <Icon icon='ep:d-arrow-left' />
              </Link>
            </li>
            <li className='page-item'>
              <Link className='page-link text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md bg-primary-600 text-white' to='#'>1</Link>
            </li>
            <li className='page-item'>
              <Link className='page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md' to='#'>
                <Icon icon='ep:d-arrow-right' />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TaxListLayer;