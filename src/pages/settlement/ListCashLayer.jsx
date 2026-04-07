import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";

const initialCashData = [
  { id: 1, vendorName: "Sai Muruga Traders", mobile: "+916381725188", amount: "₹10,500", date: "02-04-2026", paymentMode: "Net Banking", transactionId: "TXN987654321", type: "Vendors" },
  { id: 2, vendorName: "Fresh Farms", mobile: "+919876543210", amount: "₹4,200", date: "01-04-2026", paymentMode: "UPI", transactionId: "pay_SY70v9ABF", type: "Vendors" }
];

const ListCashLayer = () => {
  const [data, setData] = useState(initialCashData);

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
            <input type='text' className='bg-base h-40-px w-auto' name='search' placeholder='Search...' />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
        </div>
      </div>
      <div className='card-body p-24'>
        <div className='table-responsive scroll-sm'>
          <table className='table bordered-table sm-table mb-0 text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>S.No</th>
                <th scope='col'>Vendor Name</th>
                <th scope='col'>Vendor Mobile Number</th>
                <th scope='col'>Amount</th>
                <th scope='col'>Date</th>
                <th scope='col'>Payment Mode</th>
                <th scope='col'>Transaction ID</th>
                <th scope='col'>Settlement Type</th>
                <th scope='col' className='text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td><span className='text-md mb-0 fw-normal text-secondary-light'>{item.vendorName}</span></td>
                  <td>{item.mobile}</td>
                  <td className="fw-semibold text-success-main">{item.amount}</td>
                  <td>{item.date}</td>
                  <td>{item.paymentMode}</td>
                  <td>{item.transactionId}</td>
                  <td>{item.type}</td>
                  <td className='text-center'>
                    <div className='d-flex align-items-center gap-10 justify-content-center'>
                      <Link to={`/view-settlement/${item.id}`} className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle' title="View Settlement">
                        <Icon icon='majesticons:eye-line' className='icon text-xl' />
                      </Link>
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

export default ListCashLayer;