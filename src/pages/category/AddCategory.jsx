import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CategoryFormLayer from "./CategoryFormLayer";

const AddCategory = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Category' pagetitle='Add Category' />
      <CategoryFormLayer />
    </MasterLayout>
  );
};

export default AddCategory;