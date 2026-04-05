import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import OccupationFormLayer from "./OccupationFormLayer";

const AddOccupation = () => (
  <MasterLayout>
    <Breadcrumb title="Add Occupation" pagetitle="Add Occupation" />
    <OccupationFormLayer />
  </MasterLayout>
);

export default AddOccupation;
