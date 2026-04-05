import React from 'react';
const OrderStat = () => { 
  const orderStats = [
    {
      title: "Total Orders",
      value: "264",
      icon: "ri-shopping-cart-2-fill",
      gradient: "gradient-deep-1",
      line: "line-bg-primary",
      iconBg: "bg-primary-100 text-primary-600"
    },
    {
      title: "Total Revenue",
      value: "₹98.8K",
      icon: "ri-money-rupee-circle-fill",
      gradient: "gradient-deep-2",
      line: "line-bg-lilac",
      iconBg: "bg-lilac-200 text-lilac-600"
    },
    {
      title: "Settled Payments",
      value: "₹0",
      icon: "ri-checkbox-circle-fill",
      gradient: "gradient-deep-3",
      line: "line-bg-success",
      iconBg: "bg-success-200 text-success-600"
    },
    {
      title: "Pending Settlements",
      value: "₹107",
      icon: "ri-time-fill",
      gradient: "gradient-deep-4",
      line: "line-bg-warning",
      iconBg: "bg-warning-focus text-warning-600"
    },
    {
      title: "Total Tax Amount",
      value: "₹798",
      icon: "ri-bar-chart-box-fill",
      gradient: "gradient-deep-1",
      line: "line-bg-info", // using standard bootstrap color variants for variety
      iconBg: "bg-info-focus text-info-600" 
    },
    {
      title: "Total Discount",
      value: "₹4.2K",
      icon: "ri-gift-fill",
      gradient: "gradient-deep-2",
      line: "line-bg-danger",
      iconBg: "bg-danger-focus text-danger-600" 
    },
    {
      title: "P4U Revenue",
      value: "₹4.7K",
      icon: "ri-wallet-3-fill",
      gradient: "gradient-deep-3",
      line: "line-bg-success",
      iconBg: "bg-success-200 text-success-600"
    },
    {
      title: "Total Shipping Charges",
      value: "₹0",
      icon: "ri-truck-fill",
      gradient: "gradient-deep-4",
      line: "line-bg-primary",
      iconBg: "bg-primary-100 text-primary-600"
    }
  ];

  return (
    <div className='col-12'>
      <div className='card radius-12'>
        <div className='card-body p-16'>
          
          {/* Header Title Section */}
          <div className="mb-24 px-4">
         
            <p className="text-secondary-light mb-0">Track orders and vendor settlements</p>
          </div>
          
          {/* Grid Section */}
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