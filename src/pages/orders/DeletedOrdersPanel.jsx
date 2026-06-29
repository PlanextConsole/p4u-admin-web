import React from "react";
import ProductOrdersPanel from "./ProductOrdersPanel";
import ServiceBookingListLayer from "../bookings/ServiceBookingListLayer";

/** Deleted tab: cancelled product orders + cancelled/rejected service bookings. */
export default function DeletedOrdersPanel() {
  return (
    <div className="p4u-orders-deleted-stack">
      <ProductOrdersPanel deletedOnly />
      <div className="p4u-orders-deleted-divider">
        <span>Service bookings (cancelled / rejected)</span>
      </div>
      <ServiceBookingListLayer embedded deletedOnly />
    </div>
  );
}
