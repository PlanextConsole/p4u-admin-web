import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import FranchisePaymentListLayer from "./FranchisePaymentListLayer";

export default function FranchisePaymentsPage() {
  return <MasterLayout><div className='p4u-reference-admin p4u-franchise-admin'><Breadcrumb title='Registration Payments' pagetitle='Registration Payments' subtitle='Centralized ledger of all franchise registration payments.' /><FranchisePaymentListLayer /></div></MasterLayout>;
}
