import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import FranchisePlanListLayer from "./FranchisePlanListLayer";

export default function FranchisePlansPage() {
  return <MasterLayout><Breadcrumb title='Franchise Plans' pagetitle='Franchise Management' /><FranchisePlanListLayer /></MasterLayout>;
}
