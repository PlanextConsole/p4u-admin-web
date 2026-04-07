import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialVariables = [
  {
    id: 1,
    variableType: "PLATFORM_FEE",
    currencyType: "Ruppees",
    valueType: "FLAT",
    value: "10",
    description: "Standard platform fee applied per order.",
  },
  {
    id: 2,
    variableType: "WELCOME_BONUS",
    currencyType: "Points",
    valueType: "FLAT",
    value: "500",
    description: "Bonus points credited on new user registration.",
  },
  {
    id: 3,
    variableType: "VENDOR_PENALTY",
    currencyType: "None",
    valueType: "PERCENTAGE",
    value: "5",
    description: "Penalty deducted for delayed orders.",
  }
];

const PlatformVariableListLayer = () => {
  const [variables, setVariables] = useState(initialVariables);

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this platform variable?");
    if (confirmDelete) {
      setVariables(variables.filter((v) => v.id !== id));
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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Variable...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <Link to='/add-platform-variable' className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add Variable
        </Link>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>S.No</th>
                <th scope='col'>Variable Type</th>
                <th scope='col'>Currency Type</th>
                <th scope='col'>Value Type</th>
                <th scope='col'>Value</th>
                <th scope='col'>Description</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {variables.length > 0 ? (
                variables.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td><span className='fw-semibold text-primary-light'>{item.variableType}</span></td>
                    <td>{item.currencyType}</td>
                    <td>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${item.valueType === 'PERCENTAGE' ? 'bg-purple-focus text-purple-600' : item.valueType === 'FLAT' ? 'bg-info-focus text-info-600' : 'bg-neutral-200 text-neutral-600'}`}>
                        {item.valueType}
                      </span>
                    </td>
                    <td className="fw-bold">
                      {item.currencyType === 'Ruppees' && '₹'}
                      {item.value}
                      {item.valueType === 'PERCENTAGE' && '%'}
                      {item.currencyType === 'Points' && ' Pts'}
                    </td>
                    <td><span className="text-secondary-light text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{item.description}</span></td>
                    <td className='text-center'>
                      <div className='d-flex align-items-center gap-10 justify-content-center'>
                        <Link to={`/view-platform-variable/${item.id}`} className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="View">
                          <Icon icon='majesticons:eye-line' className='icon text-xl' />
                        </Link>
                        <Link to={`/edit-platform-variable/${item.id}`} className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Edit">
                          <Icon icon='lucide:edit' className='menu-icon' />
                        </Link>
                        <button type='button' onClick={() => handleDelete(item.id)} className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Delete">
                          <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">No platform variables found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Details */}
        <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
          <span>Showing 1 to {variables.length} of {variables.length} entries</span>
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

export default PlatformVariableListLayer;