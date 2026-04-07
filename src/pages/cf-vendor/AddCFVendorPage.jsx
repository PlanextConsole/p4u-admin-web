import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFVendorFormLayer from "./CFVendorFormLayer";

export default function AddCFVendorPage() {
  return (
    <MasterLayout>
      <Breadcrumb title='Add CF Vendor' pagetitle='CF Vendors' />
      <CFVendorFormLayer isEdit={false} />
    </MasterLayout>
  );
}