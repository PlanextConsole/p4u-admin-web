import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CustomerFormLayer from "./CustomerFormLayer";

const ViewCustomerPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='View Customer' pagetitle='View Customer' />
      <CustomerFormLayer isView customerId={id} />
    </MasterLayout>
  );
};

export default ViewCustomerPage;
