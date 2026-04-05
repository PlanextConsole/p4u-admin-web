import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CouponFormLayer from "./CouponFormLayer";

const ViewCouponPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title="View Coupon" pagetitle="View Coupon" />
      <CouponFormLayer isView couponId={id} />
    </MasterLayout>
  );
};

export default ViewCouponPage;
