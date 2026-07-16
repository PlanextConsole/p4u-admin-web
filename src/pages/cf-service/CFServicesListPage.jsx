import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFServiceListLayer from "./CFServiceListLayer";

const CFServicesListPage = () => {
  return (
    <MasterLayout>
      <div className='p4u-reference-admin'>
        <Breadcrumb title='CF Services' pagetitle='CF Services' subtitle='Manage classified services, pricing, and availability.' />
        <CFServiceListLayer />
      </div>
    </MasterLayout>
  );
};

export default CFServicesListPage;
