import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSearchParams } from "react-router-dom";
import ProductOrdersPanel from "./ProductOrdersPanel";
import ServiceBookingListLayer from "../bookings/ServiceBookingListLayer";
import DeletedOrdersPanel from "./DeletedOrdersPanel";

const TABS = [
  { key: "product", label: "Product Orders", icon: "mdi:package-variant-closed" },
  { key: "service", label: "Service Orders", icon: "mdi:wrench-outline" },
  { key: "deleted", label: "Deleted", icon: "mdi:delete-outline" },
];

export default function OrdersHubLayer({ initialTab = "product" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState(
    TABS.some((t) => t.key === tabFromUrl) ? tabFromUrl : initialTab,
  );

  useEffect(() => {
    if (tabFromUrl && TABS.some((t) => t.key === tabFromUrl) && tabFromUrl !== tab) {
      setTab(tabFromUrl);
    }
  }, [tabFromUrl, tab]);

  const selectTab = (key) => {
    setTab(key);
    if (key === "product") {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab: key }, { replace: true });
    }
  };

  return (
    <div className="p4u-orders-page">
      <div className="p4u-orders-hero">
        <h3>Orders</h3>
        <p>Product, Service &amp; Deleted orders</p>
      </div>

      <div className="p4u-orders-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "is-active" : ""}
            onClick={() => selectTab(t.key)}
          >
            <Icon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "product" && <ProductOrdersPanel />}
      {tab === "service" && <ServiceBookingListLayer embedded />}
      {tab === "deleted" && <DeletedOrdersPanel />}
    </div>
  );
}
