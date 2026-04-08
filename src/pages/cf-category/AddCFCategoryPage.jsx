import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFCategoryFormLayer from "./CFCategoryFormLayer";

const AddCFCategoryPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add CF Category' pagetitle='CF Categories' />
      <CFCategoryFormLayer isEdit={false} />
    </MasterLayout>
  );
};

export default AddCFCategoryPage;