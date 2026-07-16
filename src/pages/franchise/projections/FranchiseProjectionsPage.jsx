import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import FranchiseProjectionListLayer from "./FranchiseProjectionListLayer";

export default function FranchiseProjectionsPage() {
  return <MasterLayout><Breadcrumb title='Business Projections' pagetitle='Franchise Management' /><FranchiseProjectionListLayer /></MasterLayout>;
}
