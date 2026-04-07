import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialData = [
  { id: 1, name: "Organic Basmati Rice", description: "Long-grain aromatic rice, 5kg pack.", price: "₹850", icon: "assets/images/products/rice.png", status: "Yes" },
  { id: 2, name: "Refined Sunflower Oil", description: "Healthy cooking oil, 1L bottle.", price: "₹185", icon: "assets/images/products/oil.png", status: "No" },
];

const CFProductListLayer = () => {
  const [products] = useState(initialData);

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
        <div className='d-flex align-items-center flex-wrap gap-3'>
          <span className='text-md fw-medium text-secondary-light mb-0'>Show</span>
          <select className='form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px'>
            <option value='10'>10</option>
            <option value='20'>20</option>
          </select>
          <form className='navbar-search'>
            <input type='text' className='bg-base h-40-px w-auto' placeholder='Search Product...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <Link to='/add-cf-product' className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl' /> Add CF Product
        </Link>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>Sr No.</th>
                <th scope='col'>Icon</th>
                <th scope='col'>Name</th>
                <th scope='col'>Description</th>
                <th scope='col'>Price</th>
                <th scope='col' className='text-center'>Status</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <img src={item.icon} alt={item.name} className="w-40-px h-40-px radius-8 object-fit-cover"  />
                  </td>
                  <td><span className='fw-medium text-primary-light'>{item.name}</span></td>
                  <td><span className="text-secondary-light text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{item.description}</span></td>
                  <td className="fw-bold text-success-main">{item.price}</td>
                  <td className='text-center'>
                    <span className={`px-12 py-4 radius-4 fw-medium text-sm ${item.status === 'Yes' ? 'bg-success-focus text-success-600' : 'bg-danger-focus text-danger-600'}`}>
                      {item.status === 'Yes' ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className='text-center'>
                    <div className='d-flex align-items-center gap-10 justify-content-center'>
                      <Link to={`/view-cf-product/${item.id}`} className='bg-info-focus text-info-600 w-32-px h-32-px d-flex justify-content-center align-items-center rounded-circle'><Icon icon='majesticons:eye-line' /></Link>
                      <Link to={`/edit-cf-product/${item.id}`} className='bg-success-focus text-success-600 w-32-px h-32-px d-flex justify-content-center align-items-center rounded-circle'><Icon icon='lucide:edit' /></Link>
                      <button className='bg-danger-focus text-danger-600 w-32-px h-32-px d-flex justify-content-center align-items-center rounded-circle'><Icon icon='fluent:delete-24-regular' /></button>
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

export default CFProductListLayer;