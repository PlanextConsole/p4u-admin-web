import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFCategoryFormLayer from "./CFCategoryFormLayer";

const EditCFCategoryPage = () => {
  const dummyCategoryData = {
    name: "Groceries",
    availability: "Active",
    description: "Daily essential items, food grains, and fresh produce.",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='Edit CF Category' pagetitle='CF Categories' />
      <CFCategoryFormLayer isEdit={true} initialData={dummyCategoryData} />
    </MasterLayout>
  );
};

export default EditCFCategoryPage;