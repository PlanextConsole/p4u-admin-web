import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CouponFormLayer from "./CouponFormLayer";

const AddCoupon = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Add Coupon" pagetitle="Add Coupon" />
      <CouponFormLayer />
    </MasterLayout>
  );
};

export default AddCoupon;
