import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ServiceFormLayer from "./ServiceFormLayer";

const AddService = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Service' pagetitle='Add Service' />
      <ServiceFormLayer />
    </MasterLayout>
  );
};

export default AddService;