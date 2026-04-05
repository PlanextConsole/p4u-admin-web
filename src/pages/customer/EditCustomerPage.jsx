import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CustomerFormLayer from "./CustomerFormLayer";

const EditCustomerPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='Edit Customer' pagetitle='Edit Customer' />
      <CustomerFormLayer isEdit customerId={id} />
    </MasterLayout>
  );
};

export default EditCustomerPage;
