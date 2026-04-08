import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TaxFormLayer from "./TaxFormLayer";

const EditTaxPage = () => {
  // Simulated initial data for editing
  const dummyTaxData = {
    servicesType: "Standard Rate",
    rate: "18",
    description: "Standard GST applied to most services and products.",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='Edit Tax' pagetitle='Tax Management' />
      <TaxFormLayer isEdit={true} initialData={dummyTaxData} />
    </MasterLayout>
  );
};

export default EditTaxPage;