import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import SettlementFormLayer from "./SettlementFormLayer";

const ViewSettlementPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='View Settlement' pagetitle='Settlements' />
      <SettlementFormLayer isView={true} />
    </MasterLayout>
  );
};

export default ViewSettlementPage;