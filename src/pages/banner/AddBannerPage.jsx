import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import BannerFormLayer from "./BannerFormLayer";

const AddBannerPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Banner' pagetitle='Banners' />
      <BannerFormLayer isEdit={false} />
    </MasterLayout>
  );
};

export default AddBannerPage;