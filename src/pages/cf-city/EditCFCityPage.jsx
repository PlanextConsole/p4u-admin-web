import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFCityFormLayer from "./CFCityFormLayer";

const EditCFCityPage = () => {
  const dummyCityData = {
    cityName: "Chennai",
    description: "Capital of Tamil Nadu, known for its rich culture and IT hubs.",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='Edit City' pagetitle='CF City' />
      <CFCityFormLayer isEdit={true} initialData={dummyCityData} />
    </MasterLayout>
  );
};

export default EditCFCityPage;