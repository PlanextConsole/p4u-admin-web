import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ServiceFormLayer from "./ServiceFormLayer";

const EditServicePage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='Edit Service' pagetitle='Edit Service' />
      <ServiceFormLayer isEdit serviceId={id} />
    </MasterLayout>
  );
};

export default EditServicePage;
