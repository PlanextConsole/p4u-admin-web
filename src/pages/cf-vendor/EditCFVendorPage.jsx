import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFVendorFormLayer from "./CFVendorFormLayer";

const EditCFVendorPage = () => {
  // Dummy data to populate the form for editing
  const dummyVendorData = {
    name: "Murugan",
    businessName: "Sai Muruga Traders",
    areaName: "White Town",
    gst: "22AAAAA0000A1Z5",
    mobileNumber: "+916381725188",
    businessPhone: "0413-222333",
    email: "muruga@example.com",
    status: "Active",
    experience: "5",
    aboutBusiness: "We sell the best groceries in town.",
    address: "123 Market Street, White Town, Pondicherry",
    categories: "Event Organisers",
    services: "Delivery",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='Edit CF Vendor' pagetitle='CF Vendors' />
      <CFVendorFormLayer isEdit={true} initialData={dummyVendorData} />
    </MasterLayout>
  );
};

export default EditCFVendorPage;