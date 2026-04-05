import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { fetchAdminMetadata } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const gradients = [
  "bg-gradient-start-1",
  "bg-gradient-start-2",
  "bg-gradient-start-3",
  "bg-gradient-start-4",
  "bg-gradient-start-5",
  "bg-gradient-start-1",
  "bg-gradient-start-2",
  "bg-gradient-start-3",
];

const icons = [
  "mdi:account-group-outline",
  "mdi:account-check-outline",
  "mdi:store-outline",
  "mdi:store-check-outline",
  "mdi:cart-outline",
  "mdi:check-decagram-outline",
  "mdi:bank-transfer-out",
  "mdi:package-variant",
];

const bgColors = [
  "bg-cyan",
  "bg-purple",
  "bg-info",
  "bg-warning-main",
  "bg-primary-600",
  "bg-success-main",
  "bg-danger-main",
  "bg-cyan",
];

export default function DashboardSummary() {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAdminMetadata();
        if (!cancelled) setMeta(data);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : String(e);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-secondary-light text-md mb-24">
        Loading dashboard metrics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger radius-12 mb-24" role="alert">
        {error}
      </div>
    );
  }

  const u = meta?.users || {};
  const c = meta?.commerce || {};
  const cust = u.customers || {};
  const vend = u.vendors || {};
  const ord = c.orders || {};
  const cards = [
    { title: "Total customers", value: String(cust.total ?? "—") },
    { title: "Active customers", value: String(cust.active ?? "—") },
    { title: "Total vendors", value: String(vend.total ?? "—") },
    { title: "Active vendors", value: String(vend.active ?? "—") },
    { title: "Total orders", value: String(ord.total ?? "—") },
    { title: "Completed orders", value: String(ord.completed ?? "—") },
    { title: "Total settlements", value: String(c.settlements?.total ?? "—") },
    { title: "Total products", value: String(c.products?.total ?? "—") },
  ];

  return (
    <div className="row row-cols-xxxl-4 row-cols-lg-4 row-cols-sm-2 row-cols-1 gy-4 mb-24">
      {cards.map((item, index) => (
        <div className="col" key={item.title}>
          <div className={`card shadow-none border ${gradients[index % gradients.length]} h-100`}>
            <div className="card-body p-20">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">{item.title}</p>
                  <h6 className="mb-0">{item.value}</h6>
                </div>
                <div
                  className={`w-50-px h-50-px ${bgColors[index % bgColors.length]} rounded-circle d-flex justify-content-center align-items-center`}
                >
                  <Icon icon={icons[index % icons.length]} className="text-white text-2xl mb-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
