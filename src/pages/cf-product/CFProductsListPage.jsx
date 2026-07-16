import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import CFProductListLayer from "./CFProductListLayer";

export default function CFProductsListPage() {
  return (
    <MasterLayout>
      <div className='p4u-reference-admin'>
        <Breadcrumb title='CF Products' pagetitle='CF Products' subtitle='Manage products available through classified vendors.' />
        <CFProductListLayer />
      </div>
    </MasterLayout>
  );
}
