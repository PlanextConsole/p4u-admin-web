import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFCategoryListLayer from "./CFCategoryListLayer";

const CFCategoriesListPage = () => {
  return (
    <MasterLayout>
      <div className='p4u-reference-admin'>
        <Breadcrumb title='CF Categories' pagetitle='CF Categories' subtitle='Configure classified categories and display order.' />
        <CFCategoryListLayer />
      </div>
    </MasterLayout>
  );
};

export default CFCategoriesListPage;
