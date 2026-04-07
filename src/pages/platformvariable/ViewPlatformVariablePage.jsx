import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import PlatformVariableFormLayer from "./PlatformVariableFormLayer";

const ViewPlatformVariablePage = () => {
  const dummyVariableData = {
    variableType: "PLATFORM_FEE",
    currencyType: "Ruppees",
    valueType: "FLAT",
    value: "10",
    description: "Standard platform fee applied per order.",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='View Platform Variable' pagetitle='Platform Settings' />
      <PlatformVariableFormLayer isView={true} initialData={dummyVariableData} />
    </MasterLayout>
  );
};

export default ViewPlatformVariablePage;