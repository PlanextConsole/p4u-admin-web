import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CustomerFormLayer from "./CustomerFormLayer";

const AddCustomer = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Customer' pagetitle='Add Customer' />
      <CustomerFormLayer />
    </MasterLayout>
  );
};

export default AddCustomer;
