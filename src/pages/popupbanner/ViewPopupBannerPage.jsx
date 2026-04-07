import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import PopupBannerFormLayer from "./PopupBannerFormLayer";

const ViewPopupBannerPage = () => {
  const dummyPopupData = {
    appType: "User",
    screenId: "Splash Screen",
    active: "Active",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='View Popup Banner' pagetitle='Popup Banners' />
      <PopupBannerFormLayer isView={true} initialData={dummyPopupData} />
    </MasterLayout>
  );
};

export default ViewPopupBannerPage;