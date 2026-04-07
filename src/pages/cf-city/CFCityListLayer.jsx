import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialCities = [
  {
    id: 1,
    cityName: "Chennai",
    description: "Capital of Tamil Nadu, known for its rich culture and IT hubs.",
    icon: "assets/images/cities/chennai.png",
  },
  {
    id: 2,
    cityName: "Coimbatore",
    description: "Major hub for manufacturing, education, and healthcare in Tamil Nadu.",
    icon: "assets/images/cities/coimbatore.png",
  },
  {
    id: 3,
    cityName: "Madurai",
    description: "Known as the cultural capital of Tamil Nadu.",
    icon: "assets/images/cities/madurai.png",
  }
];

const CFCityListLayer = () => {
  const [cities, setCities] = useState(initialCities);

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this city?");
    if (confirmDelete) {
      setCities(cities.filter((city) => city.id !== id));
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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search City...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <Link to='/add-cf-city' className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add City
        </Link>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>S.No</th>
                <th scope='col'>Icon</th>
                <th scope='col'>City Name</th>
                <th scope='col'>Description</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {cities.length > 0 ? (
                cities.map((city, index) => (
                  <tr key={city.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img 
                        src={city.icon} 
                        alt={city.cityName} 
                        className="w-40-px h-40-px radius-8 object-fit-cover border"
                       
                      />
                    </td>
                    <td><span className='fw-semibold text-primary-light'>{city.cityName}</span></td>
                    <td>
                      <span className="text-secondary-light text-truncate d-inline-block" style={{ maxWidth: '300px' }}>
                        {city.description}
                      </span>
                    </td>
                    <td className='text-center'>
                      <div className='d-flex align-items-center gap-10 justify-content-center'>
                        <Link to={`/view-cf-city/${city.id}`} className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="View">
                          <Icon icon='majesticons:eye-line' className='icon text-xl' />
                        </Link>
                        <Link to={`/edit-cf-city/${city.id}`} className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Edit">
                          <Icon icon='lucide:edit' className='menu-icon' />
                        </Link>
                        <button type='button' onClick={() => handleDelete(city.id)} className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Delete">
                          <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">No cities found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Details */}
        <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
          <span>Showing 1 to {cities.length} of {cities.length} entries</span>
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

export default CFCityListLayer;