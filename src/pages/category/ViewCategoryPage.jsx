import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CategoryFormLayer from "./CategoryFormLayer";

const ViewCategoryPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='View Category' pagetitle='View Category' />
      <CategoryFormLayer isView categoryId={id} />
    </MasterLayout>
  );
};

export default ViewCategoryPage;
