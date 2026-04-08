import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFCategoryFormLayer from "./CFCategoryFormLayer";

const ViewCFCategoryPage = () => {
  const dummyCategoryData = {
    name: "Groceries",
    availability: "Active",
    description: "Daily essential items, food grains, and fresh produce.",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='View CF Category' pagetitle='CF Categories' />
      <CFCategoryFormLayer isView={true} initialData={dummyCategoryData} />
    </MasterLayout>
  );
};

export default ViewCFCategoryPage;