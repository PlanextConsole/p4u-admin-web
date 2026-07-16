import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import FranchisePaymentListLayer from "./FranchisePaymentListLayer";

export default function FranchisePaymentsPage() {
  return <MasterLayout><Breadcrumb title='Registration Payments' pagetitle='Franchise Management' /><FranchisePaymentListLayer /></MasterLayout>;
}
