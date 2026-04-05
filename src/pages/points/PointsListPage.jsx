import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import PointsListLayer from "./PointsListLayer";

const PointsListPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Points List' pagetitle='Points List' />
      <PointsListLayer />
    </MasterLayout>
  );
};

export default PointsListPage;