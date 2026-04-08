import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import PopupBannerFormLayer from "./PopupBannerFormLayer";

const EditPopupBannerPage = () => {
  const dummyPopupData = {
    appType: "User",
    screenId: "Splash Screen",
    active: "Active",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='Edit Popup Banner' pagetitle='Popup Banners' />
      <PopupBannerFormLayer isEdit={true} initialData={dummyPopupData} />
    </MasterLayout>
  );
};

export default EditPopupBannerPage;