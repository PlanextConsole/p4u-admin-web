import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFServiceFormLayer from "./CFServiceFormLayer";

const AddCFServicePage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add CF Service' pagetitle='CF Services' />
      <CFServiceFormLayer isEdit={false} />
    </MasterLayout>
  );
};

export default AddCFServicePage;