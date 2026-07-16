import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import ActiveFranchiseListLayer from "./ActiveFranchiseListLayer";

export default function ActiveFranchisesPage() {
  return <MasterLayout><Breadcrumb title='Active Franchises' pagetitle='Franchise Management' /><ActiveFranchiseListLayer /></MasterLayout>;
}
