import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CategoryListLayer from "./CategoryListLayer";

const CategoryListPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Categories List' pagetitle='Categories List' />
      <CategoryListLayer />
    </MasterLayout>
  );
};

export default CategoryListPage;