import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import FormModal from "../../components/admin/FormModal";
import CFVendorFormLayer from "./CFVendorFormLayer";

const initialVendors = [
  {
    id: 1,
    name: "Murugan",
    businessName: "Sai Muruga Traders",
    logo: "assets/images/vendors/logo1.png",
    banner: "assets/images/vendors/banner1.png",
    mobile: "+916381725188",
    categories: "Groceries",
    joinDate: "01-04-2026",
    status: "Active"
  },
  {
    id: 2,
    name: "Anitha",
    businessName: "Anitha Nail Works",
    logo: "assets/images/vendors/logo2.png",
    banner: "assets/images/vendors/banner2.png",
    mobile: "+919843236744",
    categories: "Fashion Beauty",
    joinDate: "28-03-2026",
    status: "Inactive"
  }
];

const CFVendorListLayer = () => {
  const [vendors, setVendors] = useState(initialVendors);
  const [modal, setModal] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      setVendors(vendors.filter((v) => v.id !== id));
    }
  };

  const rowForId = (id) => vendors.find((v) => v.id === id) || null;

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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Vendors...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <button type='button' onClick={() => setModal({ mode: "add" })} className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl' /> Add Vendor
        </button>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>Sr No.</th>
                <th scope='col'>Name</th>
                <th scope='col'>Business Name</th>
                <th scope='col'>Logo</th>
                <th scope='col'>Banner</th>
                <th scope='col'>Mobile Number</th>
                <th scope='col'>Categories</th>
                <th scope='col'>Join Date</th>
                <th scope='col' className='text-center'>Status</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td><span className='fw-medium text-primary-light'>{item.name}</span></td>
                  <td>{item.businessName}</td>
                  <td><img src={item.logo} alt="Logo" className="w-40-px h-40-px radius-8 object-fit-cover border"   /></td>
                  <td><img src={item.banner} alt="Banner" className="w-64-px h-40-px radius-8 object-fit-cover border" /></td>
                  <td>{item.mobile}</td>
                  <td><span className="text-secondary-light">{item.categories}</span></td>
                  <td>{item.joinDate}</td>
                  <td className='text-center'>
                    <span className={`px-12 py-4 radius-4 fw-medium text-sm ${item.status === 'Active' ? 'bg-success-focus text-success-600' : 'bg-danger-focus text-danger-600'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className='text-center'>
                    <div className='d-flex align-items-center gap-10 justify-content-center'>
                      <button type='button' onClick={() => setModal({ mode: "view", id: item.id })} className='bg-info-focus text-info-600 w-32-px h-32-px d-flex justify-content-center align-items-center rounded-circle border-0'><Icon icon='majesticons:eye-line' /></button>
                      <button type='button' onClick={() => setModal({ mode: "edit", id: item.id })} className='bg-success-focus text-success-600 w-32-px h-32-px d-flex justify-content-center align-items-center rounded-circle border-0'><Icon icon='lucide:edit' /></button>
                      <button type='button' onClick={() => handleDelete(item.id)} className='bg-danger-focus text-danger-600 w-32-px h-32-px d-flex justify-content-center align-items-center rounded-circle border-0'><Icon icon='fluent:delete-24-regular' /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="xl">
          <CFVendorFormLayer
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

export default CFVendorListLayer;
