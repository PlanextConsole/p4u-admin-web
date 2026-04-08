import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialAdvertisements = [
  {
    id: 1,
    name: "Summer Mega Sale",
    caption: "Get up to 50% off on all items",
    logoImage: "assets/images/ads/logo1.png",
    orderOfAppearance: "1",
    active: "Yes",
    type: "Image",
  },
  {
    id: 2,
    name: "New Vendor Onboarding",
    caption: "Join our platform today",
    logoImage: "assets/images/ads/logo2.png",
    orderOfAppearance: "2",
    active: "No",
    type: "Video",
  }
];

const AdvertisementListLayer = () => {
  const [ads, setAds] = useState(initialAdvertisements);

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this advertisement?");
    if (confirmDelete) {
      setAds(ads.filter((ad) => ad.id !== id));
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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Ads...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <Link to='/add-advertisement' className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add Advertisement
        </Link>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>S.No</th>
                <th scope='col'>Name</th>
                <th scope='col'>Caption</th>
                <th scope='col'>Logo Image</th>
                <th scope='col' className='text-center'>Order Of Appearance</th>
                <th scope='col' className='text-center'>Active</th>
                <th scope='col'>Type</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {ads.length > 0 ? (
                ads.map((ad, index) => (
                  <tr key={ad.id}>
                    <td>{index + 1}</td>
                    <td><span className='fw-medium text-primary-light'>{ad.name}</span></td>
                    <td><span className="text-secondary-light text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{ad.caption}</span></td>
                    <td>
                      <img 
                        src={ad.logoImage} 
                        alt="Logo" 
                        className="w-40-px h-40-px radius-8 object-fit-cover border"
                        />
                    </td>
                    <td className='text-center fw-bold'>{ad.orderOfAppearance}</td>
                    <td className='text-center'>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${ad.active === 'Yes' ? 'bg-success-focus text-success-600 border border-success-main' : 'bg-danger-focus text-danger-600 border border-danger-main'}`}>
                        {ad.active}
                      </span>
                    </td>
                    <td>
                      <span className="bg-neutral-200 text-neutral-600 px-12 py-4 radius-4 fw-medium text-sm d-inline-flex align-items-center gap-1">
                         <Icon icon={ad.type === 'Video' ? 'mdi:video-outline' : ad.type === 'Image' ? 'mdi:image-outline' : 'mdi:format-text'} />
                         {ad.type}
                      </span>
                    </td>
                    <td className='text-center'>
                      <div className='d-flex align-items-center gap-10 justify-content-center'>
                        <Link to={`/view-advertisement/${ad.id}`} className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="View">
                          <Icon icon='majesticons:eye-line' className='icon text-xl' />
                        </Link>
                        <Link to={`/edit-advertisement/${ad.id}`} className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Edit">
                          <Icon icon='lucide:edit' className='menu-icon' />
                        </Link>
                        <button type='button' onClick={() => handleDelete(ad.id)} className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Delete">
                          <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">No advertisements found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Details */}
        <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
          <span>Showing 1 to {ads.length} of {ads.length} entries</span>
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

export default AdvertisementListLayer;