import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import OrderFormLayer from "./OrderFormLayer";

const ViewOrderPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title="View Order" pagetitle="View Order" />
      <OrderFormLayer isView orderId={id} />
    </MasterLayout>
  );
};

export default ViewOrderPage;
