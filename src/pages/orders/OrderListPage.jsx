import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import OrderListLayer from "./OrderListLayer";
import OrderStat from "./OrderStat";

const OrderListPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Order List' pagetitle='Orders' />
      <OrderStat />
      <OrderListLayer />
    </MasterLayout>
  );
};

export default OrderListPage;