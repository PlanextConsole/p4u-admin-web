import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ListCashLayer from "./ListCashLayer";

const ListCashPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='List Cash' pagetitle='Settlements' />
      <ListCashLayer />
    </MasterLayout>
  );
};

export default ListCashPage;