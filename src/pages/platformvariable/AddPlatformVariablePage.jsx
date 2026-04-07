import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import PlatformVariableFormLayer from "./PlatformVariableFormLayer";

const AddPlatformVariablePage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Platform Variable' pagetitle='Platform Settings' />
      <PlatformVariableFormLayer isEdit={false} />
    </MasterLayout>
  );
};

export default AddPlatformVariablePage;