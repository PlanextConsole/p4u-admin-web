import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import OccupationListLayer from "./OccupationListLayer";

const OccupationListPage = () => (
  <MasterLayout>
    <Breadcrumb title="Occupations" pagetitle="Occupations" />
    <OccupationListLayer />
  </MasterLayout>
);

export default OccupationListPage;
