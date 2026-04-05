import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import VendorFormLayer from "./VendorFormLayer";

const EditVendorPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='Edit Vendor' pagetitle='Edit Vendor' />
      <VendorFormLayer isEdit vendorId={id} />
    </MasterLayout>
  );
};

export default EditVendorPage;
