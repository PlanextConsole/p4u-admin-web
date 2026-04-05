import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import VendorFormLayer from "./VendorFormLayer";

const AddVendor = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Vendor' pagetitle='Add Vendor' />
      <VendorFormLayer />
    </MasterLayout>
  );
};

export default AddVendor;
