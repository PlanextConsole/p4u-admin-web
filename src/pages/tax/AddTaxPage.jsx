import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TaxFormLayer from "./TaxFormLayer";

const AddTaxPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Tax' pagetitle='Tax Management' />
      <TaxFormLayer isEdit={false} />
    </MasterLayout>
  );
};

export default AddTaxPage;