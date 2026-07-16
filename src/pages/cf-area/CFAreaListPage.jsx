import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFAreaListLayer from "./CFAreaListLayer";

const CFAreaListPage = () => (
  <MasterLayout>
    <Breadcrumb title='List Areas' pagetitle='CF Area' />
    <CFAreaListLayer />
  </MasterLayout>
);

export default CFAreaListPage;
