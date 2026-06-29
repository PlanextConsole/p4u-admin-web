import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import VendorListLayer from "./VendorList";

const ProductVendorsPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Vendors" pagetitle="Product vendors" />
      <VendorListLayer
        vendorKind="product"
        pageTitle="Vendors"
        addButtonLabel="Add Product Vendor"
        searchPlaceholder="Search vendors..."
        csvFilenamePrefix="product-vendors"
        headerLinkLabel="Service Vendor"
        headerLinkTo="/service-vendors"
      />
    </MasterLayout>
  );
};

export default ProductVendorsPage;
