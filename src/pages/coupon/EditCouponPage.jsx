import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CouponFormLayer from "./CouponFormLayer";

const EditCouponPage = () => {
  const { id } = useParams();

  return (
    <MasterLayout>
      <Breadcrumb title="Edit Coupon" pagetitle="Edit Coupon" />
      <CouponFormLayer isEdit couponId={id} />
    </MasterLayout>
  );
};

export default EditCouponPage;
