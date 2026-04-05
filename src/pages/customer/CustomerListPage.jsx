import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CustomerListLayer from "./CustomerListLayer";

const CustomerListPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Customer List' pagetitle='Customer List' />
      <CustomerListLayer />
    </MasterLayout>
  );
};

export default CustomerListPage;