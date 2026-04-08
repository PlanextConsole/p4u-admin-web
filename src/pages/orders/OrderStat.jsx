import React, { useCallback, useEffect, useState } from 'react';
import { listOrders } from "../../lib/api/adminApi";

function fmtMoney(n) {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
}

const OrderStat = () => {
  const [stats, setStats] = useState({
    totalOrders: "—",
    totalRevenue: "—",
    completedOrders: "—",
    pendingOrders: "—",
    cancelledOrders: "—",
    createdOrders: "—",
    settledPayments: "—",
    pendingSettlements: "—",
    totalTax: "—",
    totalDiscount: "—",
    p4uRevenue: "—",
    totalShipping: "—",
  });

  const load = useCallback(async () => {
    try {
      // Single fetch: use API total + aggregate up to 200 rows (same cap as before)
      const allRes = await listOrders({ limit: 200, offset: 0 });
      const items = allRes.items || [];
      const total = typeof allRes.total === "number" ? allRes.total : items.length;

      let revenue = 0;
      let completed = 0;
      let pending = 0;
      let cancelled = 0;
      let created = 0;
      let settledPayments = 0;
      let pendingSettlements = 0;
      let totalTax = 0;
      let totalDiscount = 0;
      let p4uRevenue = 0;
      let totalShipping = 0;

      for (const o of items) {
        const amt = Number(o.totalAmount || 0);
        revenue += amt;
        const m = o.metadata || {};
        const s = String(o.status || "").toLowerCase();
        if (s === "completed" || s === "delivered") {
          completed++;
          settledPayments += amt;
        } else {
          pendingSettlements += amt;
        }
        if (s === "pending") pending++;
        if (s === "cancelled" || s === "canceled") cancelled++;
        if (s === "created") created++;
        totalTax += Number(m.taxAmount || m.tax || 0);
        totalDiscount += Number(m.discount || m.totalDiscount || 0);
        p4uRevenue += Number(m.p4uCommission || m.platformFee || 0);
        totalShipping += Number(m.shippingCharges || m.shipping || 0);
      }

      setStats({
        totalOrders: String(total),
        totalRevenue: `₹${revenue.toLocaleString("en-IN")}`,
        completedOrders: String(completed),
        pendingOrders: String(pending),
        cancelledOrders: String(cancelled),
        createdOrders: String(created),
        settledPayments: fmtMoney(settledPayments),
        pendingSettlements: fmtMoney(pendingSettlements),
        totalTax: fmtMoney(totalTax),
        totalDiscount: fmtMoney(totalDiscount),
        p4uRevenue: fmtMoney(p4uRevenue),
        totalShipping: fmtMoney(totalShipping),
      });
    } catch {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const orderStats = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: "ri-shopping-cart-2-fill",
      gradient: "gradient-deep-1",
      line: "line-bg-primary",
      iconBg: "bg-primary-100 text-primary-600"
    },
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      icon: "ri-money-rupee-circle-fill",
      gradient: "gradient-deep-2",
      line: "line-bg-lilac",
      iconBg: "bg-lilac-200 text-lilac-600"
    },
    {
      title: "Completed",
      value: stats.completedOrders,
      icon: "ri-checkbox-circle-fill",
      gradient: "gradient-deep-3",
      line: "line-bg-success",
      iconBg: "bg-success-200 text-success-600"
    },
    {
      title: "Pending",
      value: stats.pendingOrders,
      icon: "ri-time-fill",
      gradient: "gradient-deep-4",
      line: "line-bg-warning",
      iconBg: "bg-warning-focus text-warning-600"
    },
    {
      title: "Created",
      value: stats.createdOrders,
      icon: "ri-bar-chart-box-fill",
      gradient: "gradient-deep-1",
      line: "line-bg-info",
      iconBg: "bg-info-focus text-info-600"
    },
    {
      title: "Cancelled",
      value: stats.cancelledOrders,
      icon: "ri-close-circle-fill",
      gradient: "gradient-deep-2",
      line: "line-bg-danger",
      iconBg: "bg-danger-focus text-danger-600"
    },
  ];

  const financeStats = [
    { title: "Settled Payments", value: stats.settledPayments, icon: "ri-bank-card-fill", gradient: "gradient-deep-3", line: "line-bg-success", iconBg: "bg-success-200 text-success-600" },
    { title: "Pending Settlements", value: stats.pendingSettlements, icon: "ri-time-fill", gradient: "gradient-deep-4", line: "line-bg-warning", iconBg: "bg-warning-focus text-warning-600" },
    { title: "Total Tax Amount", value: stats.totalTax, icon: "ri-pie-chart-2-fill", gradient: "gradient-deep-1", line: "line-bg-info", iconBg: "bg-info-focus text-info-600" },
    { title: "Total Discount", value: stats.totalDiscount, icon: "ri-gift-fill", gradient: "gradient-deep-2", line: "line-bg-danger", iconBg: "bg-danger-focus text-danger-600" },
    { title: "P4U Revenue", value: stats.p4uRevenue, icon: "ri-coins-fill", gradient: "gradient-deep-3", line: "line-bg-primary", iconBg: "bg-primary-100 text-primary-600" },
    { title: "Total Shipping", value: stats.totalShipping, icon: "ri-truck-fill", gradient: "gradient-deep-4", line: "line-bg-lilac", iconBg: "bg-lilac-200 text-lilac-600" },
  ];

  const StatCard = ({ stat }) => (
    <div className={`px-20 py-16 shadow-none radius-8 h-100 ${stat.gradient} left-line ${stat.line} position-relative overflow-hidden`}>
      <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
        <div>
          <span className='mb-2 fw-medium text-secondary-light text-md'>{stat.title}</span>
          <h6 className='fw-semibold mb-1'>{stat.value}</h6>
        </div>
        <span className={`w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 ${stat.iconBg}`}>
          <i className={stat.icon} />
        </span>
      </div>
    </div>
  );

  return (
    <div className='col-12'>
      <div className='card radius-12'>
        <div className='card-body p-16'>
          <div className="mb-24 px-4">
            <p className="text-secondary-light mb-0">Track orders and vendor settlements</p>
          </div>
          <div className='row gy-4'>
            {orderStats.map((stat, index) => (
              <div className='col-xxl-3 col-xl-4 col-sm-6' key={`o-${index}`}>
                <StatCard stat={stat} />
              </div>
            ))}
          </div>
          <div className='row gy-4 mt-4'>
            {financeStats.map((stat, index) => (
              <div className='col-xxl-3 col-xl-4 col-sm-6' key={`f-${index}`}>
                <StatCard stat={stat} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStat;
