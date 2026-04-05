import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import VendorFormLayer from "./VendorFormLayer";

const ViewVendorPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='View Vendor' pagetitle='View Vendor' />
      <VendorFormLayer isView vendorId={id} />
    </MasterLayout>
  );
};

export default ViewVendorPage;
