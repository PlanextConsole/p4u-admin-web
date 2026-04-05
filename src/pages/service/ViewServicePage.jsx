import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ServiceFormLayer from "./ServiceFormLayer";

const ViewServicePage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='View Service' pagetitle='View Service' />
      <ServiceFormLayer isView serviceId={id} />
    </MasterLayout>
  );
};

export default ViewServicePage;
