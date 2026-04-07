import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import VendorEnquiryListLayer from "./VendorEnquiryListLayer";

export default function VendorEnquiryListPage() {
  return (
    <MasterLayout>
      <Breadcrumb title='Vendor Enquiries' pagetitle='CF Vendors' />
      <VendorEnquiryListLayer />
    </MasterLayout>
  );
}