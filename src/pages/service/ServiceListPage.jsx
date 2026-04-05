import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ServiceListLayer from "./ServiceListLayer";

const ServiceListPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Services List' pagetitle='Services List' />
      <ServiceListLayer />
    </MasterLayout>
  );
};

export default ServiceListPage;