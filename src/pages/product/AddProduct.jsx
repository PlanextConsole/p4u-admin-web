import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ProductFormLayer from "./ProductFormLayer";

const AddProduct = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Product' pagetitle ='Add Product' />
      <ProductFormLayer />
    </MasterLayout>
  );
};

export default AddProduct;