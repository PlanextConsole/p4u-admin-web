import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import BannerFormLayer from "./BannerFormLayer";

const ViewBannerPage = () => {
  const dummyBannerData = {
    bannerRoute: "HOME",
    availability: "Yes",
    bannerType: "IMAGE",
    broadcastApplication: "BOTH",
    bannerPlacement: "TOP",
    redirectUrl: "https://example.com/promo1",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='View Banner' pagetitle='Banners' />
      <BannerFormLayer isView={true} initialData={dummyBannerData} />
    </MasterLayout>
  );
};

export default ViewBannerPage;