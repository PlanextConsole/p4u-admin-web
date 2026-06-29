import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import VendorListLayer from "./VendorList";

const ServiceVendorsPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Vendors" pagetitle="Service vendors" />
      <VendorListLayer
        vendorKind="service"
        pageTitle="Vendors"
        addButtonLabel="Add Service Vendor"
        searchPlaceholder="Search vendors..."
        csvFilenamePrefix="service-vendors"
        headerLinkLabel="Product Vendor"
        headerLinkTo="/product-vendors"
      />
    </MasterLayout>
  );
};

export default ServiceVendorsPage;
