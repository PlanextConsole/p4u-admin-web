import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFServiceFormLayer from "./CFServiceFormLayer";

const ViewCFServicePage = () => {
  const dummyServiceData = {
    name: "Wedding Planning",
    categories: "Event Organisers",
    availability: "Active",
    description: "Complete end-to-end wedding planning and management.",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='View CF Service' pagetitle='CF Services' />
      <CFServiceFormLayer isView={true} initialData={dummyServiceData} />
    </MasterLayout>
  );
};

export default ViewCFServicePage;