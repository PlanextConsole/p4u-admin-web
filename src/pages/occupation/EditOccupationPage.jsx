import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import OccupationFormLayer from "./OccupationFormLayer";

const EditOccupationPage = () => {
  const { id } = useParams();
  return (
    <MasterLayout>
      <Breadcrumb title="Edit Occupation" pagetitle="Edit Occupation" />
      <OccupationFormLayer isEdit occupationId={id} />
    </MasterLayout>
  );
};

export default EditOccupationPage;
