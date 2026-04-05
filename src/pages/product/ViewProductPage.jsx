import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ProductFormLayer from "./ProductFormLayer";

const ViewProductPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title='View Product' pagetitle='View Product' />
      <ProductFormLayer isView productId={id} />
    </MasterLayout>
  );
};

export default ViewProductPage;
