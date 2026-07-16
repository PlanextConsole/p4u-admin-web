import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFVendorListLayer from "./CFVendorListLayer";

export default function CFVendorsListPage() {
  return (
    <MasterLayout>
      <div className='p4u-reference-admin'>
        <Breadcrumb title='CF Vendors' pagetitle='CF Vendors' subtitle='Manage classified vendors, coverage, and approval status.' />
        <CFVendorListLayer />
      </div>
    </MasterLayout>
  );
}
