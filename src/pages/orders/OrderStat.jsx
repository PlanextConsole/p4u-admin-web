import React, { useCallback, useEffect, useState } from 'react';
import { listOrders } from "../../lib/api/adminApi";

const OrderStat = () => {
  const [stats, setStats] = useState({
    totalOrders: "—",
    totalRevenue: "—",
    completedOrders: "—",
    pendingOrders: "—",
    cancelledOrders: "—",
    createdOrders: "—",
  });

  const load = useCallback(async () => {
    try {
      const res = await listOrders({ limit: 1, offset: 0 });
      const total = typeof res.total === "number" ? res.total : 0;

      // Fetch all orders to compute stats (up to 200)
      const allRes = await listOrders({ limit: 200, offset: 0 });
      const items = allRes.items || [];
      let revenue = 0;
      let completed = 0;
      let pending = 0;
      let cancelled = 0;
      let created = 0;
      for (const o of items) {
        revenue += Number(o.totalAmount || 0);
        const s = String(o.status || "").toLowerCase();
        if (s === "completed" || s === "delivered") completed++;
        else if (s === "pending") pending++;
        else if (s === "cancelled" || s === "canceled") cancelled++;
        else if (s === "created") created++;
      }
      setStats({
        totalOrders: String(total),
        totalRevenue: `₹${revenue.toLocaleString("en-IN")}`,
        completedOrders: String(completed),
        pendingOrders: String(pending),
        cancelledOrders: String(cancelled),
        createdOrders: String(created),
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

  return (
    <div className='col-12'>
      <div className='card radius-12'>
        <div className='card-body p-16'>
          <div className="mb-24 px-4">
            <p className="text-secondary-light mb-0">Track orders and vendor settlements</p>
          </div>
          <div className='row gy-4'>
            {orderStats.map((stat, index) => (
              <div className='col-xxl-3 col-xl-4 col-sm-6' key={index}>
                <div className={`px-20 py-16 shadow-none radius-8 h-100 ${stat.gradient} left-line ${stat.line} position-relative overflow-hidden`}>
                  <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                    <div>
                      <span className='mb-2 fw-medium text-secondary-light text-md'>
                        {stat.title}
                      </span>
                      <h6 className='fw-semibold mb-1'>{stat.value}</h6>
                    </div>
                    <span className={`w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 ${stat.iconBg}`}>
                      <i className={stat.icon} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStat;
