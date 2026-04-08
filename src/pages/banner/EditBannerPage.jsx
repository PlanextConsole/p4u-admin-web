import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import BannerFormLayer from "./BannerFormLayer";

const EditBannerPage = () => {
  // Simulated initial data for editing
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
      <Breadcrumb title='Edit Banner' pagetitle='Banners' />
      <BannerFormLayer isEdit={true} initialData={dummyBannerData} />
    </MasterLayout>
  );
};

export default EditBannerPage;