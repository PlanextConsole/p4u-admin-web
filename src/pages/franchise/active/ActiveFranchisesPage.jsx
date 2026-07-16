import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import ActiveFranchiseListLayer from "./ActiveFranchiseListLayer";

export default function ActiveFranchisesPage() {
  return <MasterLayout><div className='p4u-reference-admin p4u-franchise-admin'><Breadcrumb title='Active Franchises' pagetitle='Active Franchises' subtitle='Manage lifecycle, payments, and receipts of live franchise partners.' /><ActiveFranchiseListLayer /></div></MasterLayout>;
}
