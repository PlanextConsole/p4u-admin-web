import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import OrdersHubLayer from "../orders/OrdersHubLayer";

export default function ServiceBookingListPage() {
  return (
    <MasterLayout>
      <OrdersHubLayer initialTab="service" />
    </MasterLayout>
  );
}
