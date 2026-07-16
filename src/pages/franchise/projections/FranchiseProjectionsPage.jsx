import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import FranchiseProjectionListLayer from "./FranchiseProjectionListLayer";

export default function FranchiseProjectionsPage() {
  return <MasterLayout><div className='p4u-reference-admin p4u-franchise-admin'><Breadcrumb title='Business Projections' pagetitle='Business Projection Master' subtitle='Configure scenarios and territory-level franchise projections.' /><FranchiseProjectionListLayer /></div></MasterLayout>;
}
