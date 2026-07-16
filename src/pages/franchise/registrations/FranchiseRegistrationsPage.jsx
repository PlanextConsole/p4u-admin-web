import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import FranchiseRegistrationListLayer from "./FranchiseRegistrationListLayer";

export default function FranchiseRegistrationsPage() {
  return <MasterLayout><div className='p4u-reference-admin p4u-franchise-admin'><Breadcrumb title='Franchise Registrations' pagetitle='Franchise Registrations' subtitle='Manage franchise applications, payments, approvals, and conversions.' /><FranchiseRegistrationListLayer /></div></MasterLayout>;
}
