import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import FormModal from "../../components/admin/FormModal";
import PopupBannerFormLayer from "./PopupBannerFormLayer";

const initialPopupBanners = [
  {
    id: 1,
    screenId: "Splash Screen",
    appType: "User",
    active: "Active",
    popupImage: "assets/images/banners/popup1.png",
  },
  {
    id: 2,
    screenId: "Newsfeed",
    appType: "Vendor",
    active: "Deactive",
    popupImage: "assets/images/banners/popup2.png",
  },
  {
    id: 3,
    screenId: "Wallets",
    appType: "User",
    active: "Active",
    popupImage: "assets/images/banners/popup3.png",
  }
];

const PopupBannerListLayer = () => {
  const [banners, setBanners] = useState(initialPopupBanners);
  const [modal, setModal] = useState(null);
  const rowForId = (id) => banners.find((b) => b.id === id) || null;

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this popup banner?");
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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Screens...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <button type='button' onClick={() => setModal({ mode: "add" })} className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add Popup Banner
        </button>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>S.No</th>
                <th scope='col'>Screen</th>
                <th scope='col'>App Type</th>
                <th scope='col' className='text-center'>Active</th>
                <th scope='col'>Popup Image</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {banners.length > 0 ? (
                banners.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td><span className='fw-medium text-primary-light'>{item.screenId}</span></td>
                    <td>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${item.appType === 'Vendor' ? 'bg-purple-focus text-purple-600' : 'bg-info-focus text-info-600'}`}>
                        {item.appType}
                      </span>
                    </td>
                    <td className='text-center'>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${item.active === 'Active' ? 'bg-success-focus text-success-600 border border-success-main' : 'bg-danger-focus text-danger-600 border border-danger-main'}`}>
                        {item.active}
                      </span>
                    </td>
                    <td>
                      <img 
                        src={item.popupImage} 
                        alt="Popup Preview" 
                        className="w-40-px h-40-px radius-8 object-fit-cover border"
                       />
                    </td>
                    <td className='text-center'>
                      <div className='d-flex align-items-center gap-10 justify-content-center'>
                        <button type='button' onClick={() => setModal({ mode: "view", id: item.id })} className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0' title="View">
                          <Icon icon='majesticons:eye-line' className='icon text-xl' />
                        </button>
                        <button type='button' onClick={() => setModal({ mode: "edit", id: item.id })} className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0' title="Edit">
                          <Icon icon='lucide:edit' className='menu-icon' />
                        </button>
                        <button type='button' onClick={() => handleDelete(item.id)} className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Delete">
                          <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">No popup banners found.</td>
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

      {modal && (
        <FormModal onClose={() => setModal(null)} size="md">
          <PopupBannerFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            initialData={modal.id ? rowForId(modal.id) : null}
            onSuccess={() => setModal(null)}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default PopupBannerListLayer;