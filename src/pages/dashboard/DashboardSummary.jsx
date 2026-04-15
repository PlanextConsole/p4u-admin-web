import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { fetchAdminMetadata, listCatalogServices, listOrders } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

/** Compact Indian currency for card headline (e.g. ₹1.2L). */
function formatInrCompact(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x === 0) return "₹0";
  const abs = Math.abs(x);
  if (abs >= 1e7) return `₹${(x / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(x / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `₹${(x / 1e3).toFixed(2)}K`;
  return `₹${Math.round(x)}`;
}

async function sumAllOrdersTotalAmount() {
  const limit = 100;
  let offset = 0;
  let totalRows = Infinity;
  let sum = 0;
  while (offset < totalRows && offset < 50000) {
    const res = await listOrders({ limit, offset });
    const items = res.items || [];
    totalRows = typeof res.total === "number" ? res.total : offset + items.length;
    for (const o of items) {
      sum += parseFloat(o.totalAmount) || 0;
    }
    offset += items.length;
    if (items.length === 0 || offset >= totalRows) break;
  }
  return sum;
}

const METRICS = [
  { key: "customers", label: "Customers", icon: "mdi:account-group-outline", accent: "#14b8a6" },
  { key: "vendors", label: "Vendors", icon: "mdi:store-outline", accent: "#3b82f6" },
  { key: "orders", label: "Orders", icon: "mdi:cart-outline", accent: "#22c55e" },
  { key: "revenue", label: "Revenue", icon: "mdi:currency-inr", accent: "#f97316" },
  { key: "settlements", label: "Settlements", icon: "mdi:receipt-text-outline", accent: "#ec4899" },
  { key: "services", label: "Services", icon: "mdi:wrench-outline", accent: "#06b6d4" },
  { key: "activeAds", label: "Active Ads", icon: "mdi:bullhorn-outline", accent: "#0d9488" },
];

export default function DashboardSummary() {
  const [meta, setMeta] = useState(null);
  const [revenueSum, setRevenueSum] = useState(null);
  const [servicesCount, setServicesCount] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [data, rev, svcRes] = await Promise.all([
          fetchAdminMetadata(),
          sumAllOrdersTotalAmount().catch(() => null),
          listCatalogServices({ purpose: "all" }).catch(() => null),
        ]);
        if (!cancelled) {
          setMeta(data);
          setRevenueSum(rev);
          const svcItems = svcRes?.items;
          setServicesCount(Array.isArray(svcItems) ? svcItems.length : null);
        }
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
      <div className='text-secondary-light text-md mb-24'>Loading dashboard metrics…</div>
    );
  }

  if (error) {
    return (
      <div className='alert alert-danger radius-12 mb-24' role='alert'>
        {error}
      </div>
    );
  }

  const u = meta?.users || {};
  const c = meta?.commerce || {};
  const cust = u.customers || {};
  const vend = u.vendors || {};
  const ord = c.orders || {};

  const values = {
    customers: cust.total ?? "—",
    vendors: vend.total ?? "—",
    orders: ord.total ?? "—",
    revenue: revenueSum != null ? formatInrCompact(revenueSum) : "—",
    settlements: c.settlements?.total ?? "—",
    services: servicesCount != null ? String(servicesCount) : "—",
    activeAds: "—",
  };

  return (
    <div
      className='mb-24'
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "1rem",
      }}
    >
      {METRICS.map((m) => (
        <div key={m.key} className='card border-0 shadow-sm radius-16 h-100 bg-base'>
          <div className='card-body p-20'>
            <div className='d-flex align-items-start justify-content-between gap-2'>
              <div className='min-w-0'>
                <p className='text-secondary-light text-sm fw-medium mb-8'>{m.label}</p>
                <h3 className='fw-bold mb-0 text-primary-light text-2xl mt-8'>{values[m.key]}</h3>
              </div>
              <span
                className='w-48-px h-48-px radius-12 d-flex align-items-center justify-content-center flex-shrink-0'
                style={{ background: `${m.accent}18`, color: m.accent }}
                aria-hidden
              >
                <Icon icon={m.icon} className='text-2xl' />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
