import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CategoryFormLayer from "./CategoryFormLayer";

const EditCategoryPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='Edit Category' pagetitle='Edit Category' />
      <CategoryFormLayer isEdit categoryId={id} />
    </MasterLayout>
  );
};

export default EditCategoryPage;
