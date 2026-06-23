import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CategoryListLayer from "../category/CategoryListLayer";

const ServiceSubcategoryListPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Service subcategories" pagetitle="Service subcategories" />
      <CategoryListLayer variant="service-subs" />
    </MasterLayout>
  );
};

export default ServiceSubcategoryListPage;
