import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ProductFormLayer from "./ProductFormLayer";

const EditProductPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='Edit Product' pagetitle='Edit Product' />
      <ProductFormLayer isEdit productId={id} />
    </MasterLayout>
  );
};

export default EditProductPage;
