import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import OccupationFormLayer from "./OccupationFormLayer";

const ViewOccupationPage = () => {
  const { id } = useParams();
  return (
    <MasterLayout>
      <Breadcrumb title="View Occupation" pagetitle="View Occupation" />
      <OccupationFormLayer isView occupationId={id} />
    </MasterLayout>
  );
};

export default ViewOccupationPage;
