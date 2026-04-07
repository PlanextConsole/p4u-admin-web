import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialReports = [
  {
    id: 1,
    customerName: "Priyanka Vijay",
    mobileNumber: "+919043678797",
    reasonForObjection: "Spam content or misleading information",
    administratorAction: "Pending",
    createdAt: "03-04-2026 10:30 AM",
    feedDate: "01-04-2026",
  },
  {
    id: 2,
    customerName: "Rahul Sharma",
    mobileNumber: "+919876543210",
    reasonForObjection: "Inappropriate language used",
    administratorAction: "Resolved",
    createdAt: "02-04-2026 02:15 PM",
    feedDate: "30-03-2026",
  },
  {
    id: 3,
    customerName: "Anitha",
    mobileNumber: "+919843236744",
    reasonForObjection: "Fake profile or impersonation",
    administratorAction: "Dismissed",
    createdAt: "01-04-2026 09:45 AM",
    feedDate: "31-03-2026",
  }
];

const ReportLogLayer = () => {
  const [reports, setReports] = useState(initialReports);

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this report log?");
    if (confirmDelete) {
      setReports(reports.filter((report) => report.id !== id));
    }
  };

  // Helper function to colorize administrator action status
  const getActionBadge = (action) => {
    switch (action) {
      case 'Resolved':
        return 'bg-success-focus text-success-600 border border-success-main';
      case 'Pending':
        return 'bg-warning-focus text-warning-600 border border-warning-main';
      case 'Dismissed':
        return 'bg-danger-focus text-danger-600 border border-danger-main';
      default:
        return 'bg-neutral-200 text-neutral-600 border border-neutral-400';
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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search Reports...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
          <select className='form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px' defaultValue=''>
            <option value='' disabled>Filter Action</option>
            <option value='Pending'>Pending</option>
            <option value='Resolved'>Resolved</option>
            <option value='Dismissed'>Dismissed</option>
          </select>
        </div>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>S.No</th>
                <th scope='col'>Customer Name</th>
                <th scope='col'>Mobile Number</th>
                <th scope='col'>Reason For Objection</th>
                <th scope='col' className='text-center'>Administrator Action</th>
                <th scope='col'>Created At</th>
                <th scope='col'>Feed Date</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? (
                reports.map((report, index) => (
                  <tr key={report.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className='text-md mb-0 fw-medium text-primary-light'>
                        {report.customerName}
                      </span>
                    </td>
                    <td>{report.mobileNumber}</td>
                    <td>
                      {/* Truncate long reasons with a max-width if necessary */}
                      <span className="text-secondary-light d-inline-block text-truncate" style={{ maxWidth: '250px' }} title={report.reasonForObjection}>
                        {report.reasonForObjection}
                      </span>
                    </td>
                    <td className='text-center'>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${getActionBadge(report.administratorAction)}`}>
                        {report.administratorAction}
                      </span>
                    </td>
                    <td>{report.createdAt}</td>
                    <td>{report.feedDate}</td>
                    <td className='text-center'>
                      <div className='d-flex align-items-center gap-10 justify-content-center'>
                        <Link to={`/view-report/${report.id}`} className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="View Details">
                          <Icon icon='majesticons:eye-line' className='icon text-xl' />
                        </Link>
                        {/* Optional Edit/Process button to change the status */}
                        <Link to={`/edit-report/${report.id}`} className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Update Action">
                          <Icon icon='lucide:edit' className='menu-icon' />
                        </Link>
                        <button type='button' onClick={() => handleDelete(report.id)} className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="Delete Log">
                          <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">No report logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Details */}
        <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
          <span>Showing 1 to {reports.length} of {reports.length} entries</span>
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

export default ReportLogLayer;