import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import FranchisePlanListLayer from "./FranchisePlanListLayer";

export default function FranchisePlansPage() {
  return <MasterLayout><div className='p4u-reference-admin p4u-franchise-admin'><Breadcrumb title='Franchise Plans' pagetitle='Franchise Plans' subtitle='Configure franchise packages, coverage, and benefits.' /><FranchisePlanListLayer /></div></MasterLayout>;
}
