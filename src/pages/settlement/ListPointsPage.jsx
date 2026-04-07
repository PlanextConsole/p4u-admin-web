import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ListPointsLayer from "./ListPointsLayer";

const ListPointsPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='List Points' pagetitle='Settlements' />
      <ListPointsLayer />
    </MasterLayout>
  );
};

export default ListPointsPage;