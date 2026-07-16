import React from "react";
import MasterLayout from "../../../masterLayout/MasterLayout";
import Breadcrumb from "../../../components/Breadcrumb";
import FranchiseRegistrationListLayer from "./FranchiseRegistrationListLayer";

export default function FranchiseRegistrationsPage() {
  return <MasterLayout><Breadcrumb title='Franchise Registrations' pagetitle='Franchise Management' /><FranchiseRegistrationListLayer /></MasterLayout>;
}
