import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialBanners = [
  {
    id: 1,
    bannerImage: "assets/images/banners/banner1.jpg",
    bannerRoute: "HOME",
    availability: "Yes",
    bannerType: "IMAGE",
    broadcastApplication: "BOTH",
    bannerPlacement: "TOP",
    redirectUrl: "https://example.com/promo1",
  },
  {
    id: 2,
    bannerImage: "assets/images/banners/banner2.jpg",
    bannerRoute: "MAIN_SCREEN",
    availability: "No",
    bannerType: "VIDEO",
    broadcastApplication: "CUSTOMER",
    bannerPlacement: "MIDDLE",
    redirectUrl: "https://example.com/promo2",
  }
];

const BannerListLayer = () => {
  const [banners, setBanners] = useState(initialBanners);

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this banner?");
    if (confirmDelete) {
      setBanners(banners.filter((banner) => banner.id !== id));
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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Route...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <Link to='/add-banner' className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add Banner
        </Link>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>S.No</th>
                <th scope='col'>Banner</th>
                <th scope='col'>Route</th>
                <th scope='col'>Placement</th>
                <th scope='col'>Type</th>
                <th scope='col'>Application</th>
                <th scope='col' className='text-center'>Availability</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {banners.length > 0 ? (
                banners.map((banner, index) => (
                  <tr key={banner.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <img 
                          src={banner.bannerImage} 
                          alt="Banner Preview" 
                          className="w-64-px h-40-px radius-8 object-fit-cover me-12"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/64x40?text=Banner' }} 
                        />
                      </div>
                    </td>
                    <td><span className='fw-medium text-primary-light'>{banner.bannerRoute}</span></td>
                    <td>{banner.bannerPlacement}</td>
                    <td>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${banner.bannerType === 'VIDEO' ? 'bg-purple-focus text-purple-600' : 'bg-info-focus text-info-600'}`}>
                        <Icon icon={banner.bannerType === 'VIDEO' ? 'mdi:video-outline' : 'mdi:image-outline'} className="me-4" />
                        {banner.bannerType}
                      </span>
                    </td>
                    <td>{banner.broadcastApplication}</td>
                    <td className='text-center'>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${banner.availability === 'Yes' ? 'bg-success-focus text-success-600 border border-success-main' : 'bg-danger-focus text-danger-600 border border-danger-main'}`}>
                        {banner.availability}
                      </span>
                    </td>
                    <td className='text-center'>
                      <div className='d-flex align-items-center gap-10 justify-content-center'>
                        <Link to={`/view-banner/${banner.id}`} className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="View">
                          <Icon icon='majesticons:eye-line' className='icon text-xl' />
                        </Link>
                        <Link to={`/edit-banner/${banner.id}`} className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Edit">
                          <Icon icon='lucide:edit' className='menu-icon' />
                        </Link>
                        <button type='button' onClick={() => handleDelete(banner.id)} className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Delete">
                          <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">No banners found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Details */}
        <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
          <span>Showing 1 to {banners.length} of {banners.length} entries</span>
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

export default BannerListLayer;