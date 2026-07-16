import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFAreaListLayer from "./CFAreaListLayer";

const CFAreaListPage = () => (
  <MasterLayout>
    <div className='p4u-reference-admin'>
      <Breadcrumb title='CF Area' pagetitle='CF Area' subtitle='Configure classified service areas and availability.' />
      <CFAreaListLayer />
    </div>
  </MasterLayout>
);

export default CFAreaListPage;
