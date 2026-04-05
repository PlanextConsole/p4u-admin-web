import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import OrderFormLayer from "./OrderFormLayer";

const EditOrderPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title="Edit Order" pagetitle="Edit Order" />
      <OrderFormLayer isEdit orderId={id} />
    </MasterLayout>
  );
};

export default EditOrderPage;
