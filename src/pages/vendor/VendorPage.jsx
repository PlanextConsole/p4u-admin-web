import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import VendorListLayer from "./VendorList";

const VendorListPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */} 
        <Breadcrumb title='Vendor List' pagetitle='Vendor List' />

        {/* VendorListLayer */}
        <VendorListLayer />
      </MasterLayout>
    </>
  );
};

export default VendorListPage;