import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import PlatformVariableFormLayer from "./PlatformVariableFormLayer";

const ViewPlatformVariablePage = () => {
  const { id } = useParams();
  return (
    <MasterLayout>
      <Breadcrumb title='View Platform Variable' pagetitle='Platform Settings' />
      <PlatformVariableFormLayer isView={true} variableId={id} />
    </MasterLayout>
  );
};

export default ViewPlatformVariablePage;
