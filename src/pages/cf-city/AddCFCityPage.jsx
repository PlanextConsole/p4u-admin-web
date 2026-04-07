import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFCityFormLayer from "./CFCityFormLayer";

const AddCFCityPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add City' pagetitle='CF City' />
      <CFCityFormLayer isEdit={false} />
    </MasterLayout>
  );
};

export default AddCFCityPage;