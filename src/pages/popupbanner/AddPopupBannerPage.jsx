import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import PopupBannerFormLayer from "./PopupBannerFormLayer";

const AddPopupBannerPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Popup Banner' pagetitle='Popup Banners' />
      <PopupBannerFormLayer isEdit={false} />
    </MasterLayout>
  );
};

export default AddPopupBannerPage;