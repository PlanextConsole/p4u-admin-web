import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import FormModal from "../../components/admin/FormModal";
import CFServiceFormLayer from "./CFServiceFormLayer";

const initialServices = [
  {
    id: 1,
    name: "Wedding Planning",
    category: "Event Organisers",
    description: "Complete end-to-end wedding planning and management.",
    icon: "assets/images/services/wedding.png",
    availability: "Active",
  },
  {
    id: 2,
    name: "Home Appliance Repair",
    category: "Electronics",
    description: "Repair and maintenance of all major household appliances.",
    icon: "assets/images/services/repair.png",
    availability: "Inactive",
  },
  {
    id: 3,
    name: "Personal Training",
    category: "Health Fitness",
    description: "1-on-1 personalized fitness and diet training.",
    icon: "assets/images/services/fitness.png",
    availability: "Active",
  }
];

const CFServiceListLayer = () => {
  const [services, setServices] = useState(initialServices);
  const [modal, setModal] = useState(null);
  const rowForId = (id) => services.find((s) => s.id === id) || null;

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this service?");
    if (confirmDelete) {
      setServices(services.filter((srv) => srv.id !== id));
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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Services...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
        <button type='button' onClick={() => setModal({ mode: "add" })} className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add CF Service
        </button>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>Sr No.</th>
                <th scope='col'>Icon</th>
                <th scope='col'>Name</th>
                <th scope='col'>Categories</th>
                <th scope='col'>Description</th>
                <th scope='col' className='text-center'>Availability</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {services.length > 0 ? (
                services.map((service, index) => (
                  <tr key={service.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img 
                        src={service.icon} 
                        alt={service.name} 
                        className="w-40-px h-40-px radius-8 object-fit-cover border"
                        />
                    </td>
                    <td><span className='fw-semibold text-primary-light'>{service.name}</span></td>
                    <td><span className='text-secondary-light'>{service.category}</span></td>
                    <td>
                      <span className="text-secondary-light text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                        {service.description}
                      </span>
                    </td>
                    <td className='text-center'>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${service.availability === 'Active' ? 'bg-success-focus text-success-600 border border-success-main' : 'bg-danger-focus text-danger-600 border border-danger-main'}`}>
                        {service.availability}
                      </span>
                    </td>
                    <td className='text-center'>
                      <div className='d-flex align-items-center gap-10 justify-content-center'>
                        <button type='button' onClick={() => setModal({ mode: "view", id: service.id })} className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0' title="View">
                          <Icon icon='majesticons:eye-line' className='icon text-xl' />
                        </button>
                        <button type='button' onClick={() => setModal({ mode: "edit", id: service.id })} className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0' title="Edit">
                          <Icon icon='lucide:edit' className='menu-icon' />
                        </button>
                        <button type='button' onClick={() => handleDelete(service.id)} className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Delete">
                          <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">No services found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Details */}
        <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
          <span>Showing 1 to {services.length} of {services.length} entries</span>
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
        <FormModal onClose={() => setModal(null)} size="lg">
          <CFServiceFormLayer
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

export default CFServiceListLayer;