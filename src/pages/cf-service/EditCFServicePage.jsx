import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFServiceFormLayer from "./CFServiceFormLayer";

const EditCFServicePage = () => {
  const dummyServiceData = {
    name: "Wedding Planning",
    categories: "Event Organisers",
    availability: "Active",
    description: "Complete end-to-end wedding planning and management.",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='Edit CF Service' pagetitle='CF Services' />
      <CFServiceFormLayer isEdit={true} initialData={dummyServiceData} />
    </MasterLayout>
  );
};

export default EditCFServicePage;