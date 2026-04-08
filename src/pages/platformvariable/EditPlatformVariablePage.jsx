import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import PlatformVariableFormLayer from "./PlatformVariableFormLayer";

const EditPlatformVariablePage = () => {
  const { id } = useParams();
  return (
    <MasterLayout>
      <Breadcrumb title='Edit Platform Variable' pagetitle='Platform Settings' />
      <PlatformVariableFormLayer isEdit={true} variableId={id} />
    </MasterLayout>
  );
};

export default EditPlatformVariablePage;
