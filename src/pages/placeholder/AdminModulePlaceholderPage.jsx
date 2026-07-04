import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";

const DEFAULT_ITEMS = [
  "Wire API list and filters",
  "Add create/edit/view actions",
  "Add export and audit controls",
];

export default function AdminModulePlaceholderPage({ title, section, subtitle, nextItems = DEFAULT_ITEMS }) {
  return (
    <MasterLayout>
      <Breadcrumb title={title} pagetitle={section || title} subtitle={subtitle || "Module shell is ready for implementation."} />
      <div className='card h-100 p-0 radius-12 overflow-hidden'>
        <div className='card-body p-24'>
          <div className='d-flex flex-wrap align-items-start justify-content-between gap-16 mb-24'>
            <div>
              <span className='badge bg-primary-50 text-primary-600 border border-primary-100 mb-12'>{section}</span>
              <h5 className='mb-8'>{title}</h5>
              <p className='text-secondary-light mb-0'>This module route is registered. Share the fields and flow, then we can build the full screen here.</p>
            </div>
          </div>
          <div className='row gy-3'>
            {nextItems.map((item, index) => (
              <div className='col-md-4' key={item}>
                <div className='border rounded-3 p-16 h-100 bg-neutral-50'>
                  <span className='d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-100 text-primary-600 fw-semibold mb-12' style={{ width: 32, height: 32 }}>
                    {index + 1}
                  </span>
                  <p className='mb-0 fw-medium text-primary-light'>{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}