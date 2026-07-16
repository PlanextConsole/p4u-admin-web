import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFCityListLayer from "./CFCityListLayer";

const CFCityListPage = () => {
  return (
    <MasterLayout>
      <div className='p4u-reference-admin'>
        <Breadcrumb title='CF City' pagetitle='CF City' subtitle='Configure classified cities and their service coverage.' />
        <CFCityListLayer />
      </div>
    </MasterLayout>
  );
};

export default CFCityListPage;
