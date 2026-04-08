import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import AdvertisementFormLayer from "./AdvertisementFormLayer";

const ViewAdvertisementPage = () => {
  const dummyAdData = {
    advertisementName: "Summer Mega Sale",
    caption: "Get up to 50% off on all items",
    buttonTitle: "Shop Now",
    redirectUrl: "https://example.com",
    orderOfAppearance: "1",
    availability: "Yes",
    postType: "Image",
  };

  return (
    <MasterLayout>
      <Breadcrumb title='View Advertisement' pagetitle='Advertisements' />
      <AdvertisementFormLayer isView={true} initialData={dummyAdData} />
    </MasterLayout>
  );
};

export default ViewAdvertisementPage;