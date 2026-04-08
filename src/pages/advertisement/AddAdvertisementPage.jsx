import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import AdvertisementFormLayer from "./AdvertisementFormLayer";

const AddAdvertisementPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title='Add Advertisement' pagetitle='Advertisements' />
      <AdvertisementFormLayer isEdit={false} />
    </MasterLayout>
  );
};

export default AddAdvertisementPage;