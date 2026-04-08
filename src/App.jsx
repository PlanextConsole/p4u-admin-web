import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRouteLayout from "./components/ProtectedRouteLayout";
import Dashboard from "./pages/dashboard/DashoardLayout";
import HomePageTwo from "./pages/HomePageTwo";
import HomePageThree from "./pages/HomePageThree";
import HomePageFour from "./pages/HomePageFour";
import HomePageFive from "./pages/HomePageFive";
import HomePageSix from "./pages/HomePageSix";
import HomePageSeven from "./pages/HomePageSeven";
import EmailPage from "./pages/EmailPage";
import AddUserPage from "./pages/AddUserPage";
import AlertPage from "./pages/AlertPage";
import AssignRolePage from "./pages/AssignRolePage";
import AvatarPage from "./pages/AvatarPage";
import BadgesPage from "./pages/BadgesPage";
import ButtonPage from "./pages/ButtonPage";
import CalendarMainPage from "./pages/CalendarMainPage";
import CardPage from "./pages/CardPage";
import CarouselPage from "./pages/CarouselPage";
import ChatMessagePage from "./pages/ChatMessagePage";
import ChatProfilePage from "./pages/ChatProfilePage";
import CodeGeneratorNewPage from "./pages/CodeGeneratorNewPage";
import CodeGeneratorPage from "./pages/CodeGeneratorPage";
import ColorsPage from "./pages/ColorsPage";
import ColumnChartPage from "./pages/ColumnChartPage";
import CompanyPage from "./pages/CompanyPage";
import CurrenciesPage from "./pages/CurrenciesPage";
import DropdownPage from "./pages/DropdownPage";
import ErrorPage from "./pages/ErrorPage";
import FaqPage from "./pages/FaqPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import FormLayoutPage from "./pages/FormLayoutPage";
import FormValidationPage from "./pages/FormValidationPage";
import FormPage from "./pages/FormPage";
import GalleryPage from "./pages/GalleryPage";
import ImageGeneratorPage from "./pages/ImageGeneratorPage";
import ImageUploadPage from "./pages/ImageUploadPage";
import InvoiceAddPage from "./pages/InvoiceAddPage";
import InvoiceEditPage from "./pages/InvoiceEditPage";
import InvoiceListPage from "./pages/InvoiceListPage";
import InvoicePreviewPage from "./pages/InvoicePreviewPage";
import KanbanPage from "./pages/KanbanPage";
import LanguagePage from "./pages/LanguagePage";
import LineChartPage from "./pages/LineChartPage";
import ListPage from "./pages/ListPage";
import MarketplaceDetailsPage from "./pages/MarketplaceDetailsPage";
import MarketplacePage from "./pages/MarketplacePage";
import NotificationAlertPage from "./pages/NotificationAlertPage";
import NotificationPage from "./pages/NotificationPage";
import PaginationPage from "./pages/PaginationPage";
import PaymentGatewayPage from "./pages/PaymentGatewayPage";
import PieChartPage from "./pages/PieChartPage";
import PortfolioPage from "./pages/PortfolioPage";
import PricingPage from "./pages/PricingPage";
import ProgressPage from "./pages/ProgressPage";
import RadioPage from "./pages/RadioPage";
import RoleAccessPage from "./pages/RoleAccessPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import StarRatingPage from "./pages/StarRatingPage";
import StarredPage from "./pages/StarredPage";
import SwitchPage from "./pages/SwitchPage";
import TableBasicPage from "./pages/TableBasicPage";
import TableDataPage from "./pages/TableDataPage";
import TabsPage from "./pages/TabsPage";
import TagsPage from "./pages/TagsPage";
import TermsConditionPage from "./pages/TermsConditionPage";
import TextGeneratorPage from "./pages/TextGeneratorPage";
import ThemePage from "./pages/ThemePage";
import TooltipPage from "./pages/TooltipPage";
import TypographyPage from "./pages/TypographyPage";
import UsersGridPage from "./pages/UsersGridPage";
import UsersListPage from "./pages/UsersListPage";
import ViewDetailsPage from "./pages/ViewDetailsPage";
import VideoGeneratorPage from "./pages/VideoGeneratorPage";
import VideosPage from "./pages/VideosPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import VoiceGeneratorPage from "./pages/VoiceGeneratorPage";
import WalletPage from "./pages/WalletPage";
import WidgetsPage from "./pages/WidgetsPage";
import WizardPage from "./pages/WizardPage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import TextGeneratorNewPage from "./pages/TextGeneratorNewPage";
import HomePageEight from "./pages/HomePageEight";
import HomePageNine from "./pages/HomePageNine";
import HomePageTen from "./pages/HomePageTen";
import HomePageEleven from "./pages/HomePageEleven";
import GalleryGridPage from "./pages/GalleryGridPage";
import GalleryMasonryPage from "./pages/GalleryMasonryPage";
import GalleryHoverPage from "./pages/GalleryHoverPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailsPage from "./pages/BlogDetailsPage";
import AddBlogPage from "./pages/AddBlogPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import MaintenancePage from "./pages/MaintenancePage";
import BlankPagePage from "./pages/BlankPagePage";




//  VENDOR

import Vendorpage from './pages/vendor/VendorPage'
import AddVendor from './pages/vendor/AddVendor'
import EditVendorPage from './pages/vendor/EditVendorPage';
import ViewVendorPage from './pages/vendor/ViewVendorPage';
import VendorEnquiryPage from './pages/vendor/VendorEnquiryPage';


// PRODUCT (New Imports)
import ProductListPage from './pages/product/ProductListPage';
import AddProduct from './pages/product/AddProduct';
import EditProductPage from './pages/product/EditProductPage';
import ViewProductPage from './pages/product/ViewProductPage';

// CATEGORY IMPORTS
import CategoryListPage from './pages/category/CategoryListPage';
import AddCategory from './pages/category/AddCategory';
import EditCategoryPage from './pages/category/EditCategoryPage';
import ViewCategoryPage from './pages/category/ViewCategoryPage';

// SERVICE IMPORTS
import ServiceListPage from './pages/service/ServiceListPage';
import AddService from './pages/service/AddService';
import EditServicePage from './pages/service/EditServicePage';
import ViewServicePage from './pages/service/ViewServicePage';

// CUSTOMER IMPORTS
import CustomerListPage from './pages/customer/CustomerListPage';
import AddCustomer from './pages/customer/AddCustomer';
import EditCustomerPage from './pages/customer/EditCustomerPage';
import ViewCustomerPage from './pages/customer/ViewCustomerPage';

import PlatformVariablesListPage from './pages/platformvariable/PlatformVariablesListPage';
import AddPlatformVariablePage from './pages/platformvariable/AddPlatformVariablePage';
import EditPlatformVariablePage from './pages/platformvariable/EditPlatformVariablePage';
import ViewPlatformVariablePage from './pages/platformvariable/ViewPlatformVariablePage';

import CouponListPage from './pages/coupon/CouponListPage';
import AddCoupon from './pages/coupon/AddCoupon';
import EditCouponPage from './pages/coupon/EditCouponPage';
import ViewCouponPage from './pages/coupon/ViewCouponPage';

import OccupationListPage from './pages/occupation/OccupationListPage';
import AddOccupation from './pages/occupation/AddOccupation';
import EditOccupationPage from './pages/occupation/EditOccupationPage';
import ViewOccupationPage from './pages/occupation/ViewOccupationPage';

// POINTS

import PointsListPage from './pages/points/PointsListPage';
// POINTS

import Login from './pages/auth/Login';


// ORDER IMPORTS
import OrderListPage from './pages/orders/OrderListPage';
import EditOrderPage from './pages/orders/EditOrderPage';
import ViewOrderPage from './pages/orders/ViewOrderPage';



function App() {
  return (
    <BrowserRouter>
      <RouteScrollToTop />
      <Routes> 
       <Route exact path='/' element={<Login />} /> 
  <Route exact path='/login' element={<Login />} />

  <Route element={<ProtectedRouteLayout />}>
  <Route exact path='/dashboard' element={<Dashboard />} /> 
        {/* VENDOR */} 
        <Route exact path='/vendor' element={<Vendorpage />} />
        <Route exact path='/add-vendor' element={<AddVendor />} />
        <Route exact path='/edit-vendor/:id' element={<EditVendorPage />} />
        <Route exact path='/view-vendor/:id' element={<ViewVendorPage />} />
        <Route exact path='/vendor-enquiry' element={<VendorEnquiryPage />} />



        {/* PRODUCT */}
        <Route exact path='/product' element={<ProductListPage />} />
        <Route exact path='/add-product' element={<AddProduct />} />
        <Route exact path='/edit-product/:id' element={<EditProductPage />} />
        <Route exact path='/view-product/:id' element={<ViewProductPage />} />


{/* CATEGORY */}
<Route exact path='/category' element={<CategoryListPage />} />
<Route exact path='/add-category' element={<AddCategory />} />
<Route exact path='/edit-category/:id' element={<EditCategoryPage />} />
<Route exact path='/view-category/:id' element={<ViewCategoryPage />} />

{/* SERVICE */}
<Route exact path='/service' element={<ServiceListPage />} />
<Route exact path='/add-service' element={<AddService />} />
<Route exact path='/edit-service/:id' element={<EditServicePage />} />
<Route exact path='/view-service/:id' element={<ViewServicePage />} />

{/* CUSTOMER */}
<Route exact path='/customer' element={<CustomerListPage />} />
<Route exact path='/add-customer' element={<AddCustomer />} />
<Route exact path='/edit-customer/:id' element={<EditCustomerPage />} />
<Route exact path='/view-customer/:id' element={<ViewCustomerPage />} />

{/* COUPONS */}
<Route exact path='/platform-variables' element={<PlatformVariablesListPage />} />
        <Route exact path='/add-platform-variable' element={<AddPlatformVariablePage />} />
        <Route exact path='/edit-platform-variable/:id' element={<EditPlatformVariablePage />} />
        <Route exact path='/view-platform-variable/:id' element={<ViewPlatformVariablePage />} />
        <Route exact path='/coupons' element={<CouponListPage />} />
<Route exact path='/add-coupon' element={<AddCoupon />} />
<Route exact path='/edit-coupon/:id' element={<EditCouponPage />} />
<Route exact path='/view-coupon/:id' element={<ViewCouponPage />} />

{/* OCCUPATIONS */}
<Route exact path='/occupations' element={<OccupationListPage />} />
<Route exact path='/add-occupation' element={<AddOccupation />} />
<Route exact path='/edit-occupation/:id' element={<EditOccupationPage />} />
<Route exact path='/view-occupation/:id' element={<ViewOccupationPage />} />

{/* POINTS */}
<Route exact path='/points' element={<PointsListPage />} />



{/* ORDERS */}
<Route exact path='/orders' element={<OrderListPage />} />
<Route exact path='/edit-order/:id' element={<EditOrderPage />} />
<Route exact path='/view-order/:id' element={<ViewOrderPage />} />

    

        <Route exact path='/dashboard-2' element={<HomePageTwo />} />
        <Route exact path='/dashboard-3' element={<HomePageThree />} />
        <Route exact path='/dashboard-4' element={<HomePageFour />} />
        <Route exact path='/dashboard-5' element={<HomePageFive />} />
        <Route exact path='/dashboard-6' element={<HomePageSix />} />
        <Route exact path='/dashboard-7' element={<HomePageSeven />} />
        <Route exact path='/dashboard-8' element={<HomePageEight />} />
        <Route exact path='/dashboard-9' element={<HomePageNine />} />
        <Route exact path='/dashboard-10' element={<HomePageTen />} />
        <Route exact path='/dashboard-11' element={<HomePageEleven />} />

        {/* SL */}
        <Route exact path='/add-user' element={<AddUserPage />} />
        <Route exact path='/alert' element={<AlertPage />} />
        <Route exact path='/assign-role' element={<AssignRolePage />} />
        <Route exact path='/avatar' element={<AvatarPage />} />
        <Route exact path='/badges' element={<BadgesPage />} />
        <Route exact path='/button' element={<ButtonPage />} />
        <Route exact path='/calendar-main' element={<CalendarMainPage />} />
        <Route exact path='/calendar' element={<CalendarMainPage />} />
        <Route exact path='/card' element={<CardPage />} />
        <Route exact path='/carousel' element={<CarouselPage />} />

        <Route exact path='/chat-message' element={<ChatMessagePage />} />
        <Route exact path='/chat-profile' element={<ChatProfilePage />} />
        <Route exact path='/code-generator' element={<CodeGeneratorPage />} />
        <Route
          exact
          path='/code-generator-new'
          element={<CodeGeneratorNewPage />}
        />
        <Route exact path='/colors' element={<ColorsPage />} />
        <Route exact path='/column-chart' element={<ColumnChartPage />} />
        <Route exact path='/company' element={<CompanyPage />} />
        <Route exact path='/currencies' element={<CurrenciesPage />} />
        <Route exact path='/dropdown' element={<DropdownPage />} />
        <Route exact path='/email' element={<EmailPage />} />
        <Route exact path='/faq' element={<FaqPage />} />
        <Route exact path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route exact path='/form-layout' element={<FormLayoutPage />} />
        <Route exact path='/form-validation' element={<FormValidationPage />} />
        <Route exact path='/form' element={<FormPage />} />

        <Route exact path='/gallery' element={<GalleryPage />} />
        <Route exact path='/gallery-grid' element={<GalleryGridPage />} />
        <Route exact path='/gallery-masonry' element={<GalleryMasonryPage />} />
        <Route exact path='/gallery-hover' element={<GalleryHoverPage />} />

        <Route exact path='/blog' element={<BlogPage />} />
        <Route exact path='/blog-details' element={<BlogDetailsPage />} />
        <Route exact path='/add-blog' element={<AddBlogPage />} />

        <Route exact path='/testimonials' element={<TestimonialsPage />} />
        <Route exact path='/coming-soon' element={<ComingSoonPage />} />
        <Route exact path='/access-denied' element={<AccessDeniedPage />} />
        <Route exact path='/maintenance' element={<MaintenancePage />} />
        <Route exact path='/blank-page' element={<BlankPagePage />} />

        <Route exact path='/image-generator' element={<ImageGeneratorPage />} />
        <Route exact path='/image-upload' element={<ImageUploadPage />} />
        <Route exact path='/invoice-add' element={<InvoiceAddPage />} />
        <Route exact path='/invoice-edit' element={<InvoiceEditPage />} />
        <Route exact path='/invoice-list' element={<InvoiceListPage />} />
        <Route exact path='/invoice-preview' element={<InvoicePreviewPage />} />
        <Route exact path='/kanban' element={<KanbanPage />} />
        <Route exact path='/language' element={<LanguagePage />} />
        <Route exact path='/line-chart' element={<LineChartPage />} />
        <Route exact path='/list' element={<ListPage />} />
        <Route
          exact
          path='/marketplace-details'
          element={<MarketplaceDetailsPage />}
        />
        <Route exact path='/marketplace' element={<MarketplacePage />} />
        <Route
          exact
          path='/notification-alert'
          element={<NotificationAlertPage />}
        />
        <Route exact path='/notification' element={<NotificationPage />} />
        <Route exact path='/pagination' element={<PaginationPage />} />
        <Route exact path='/payment-gateway' element={<PaymentGatewayPage />} />
        <Route exact path='/pie-chart' element={<PieChartPage />} />
        <Route exact path='/portfolio' element={<PortfolioPage />} />
        <Route exact path='/pricing' element={<PricingPage />} />
        <Route exact path='/progress' element={<ProgressPage />} />
        <Route exact path='/radio' element={<RadioPage />} />
        <Route exact path='/role-access' element={<RoleAccessPage />} />
        <Route exact path='/sign-in' element={<SignInPage />} />
        <Route exact path='/sign-up' element={<SignUpPage />} />
        <Route exact path='/star-rating' element={<StarRatingPage />} />
        <Route exact path='/starred' element={<StarredPage />} />
        <Route exact path='/switch' element={<SwitchPage />} />
        <Route exact path='/table-basic' element={<TableBasicPage />} />
        <Route exact path='/table-data' element={<TableDataPage />} />
        <Route exact path='/tabs' element={<TabsPage />} />
        <Route exact path='/tags' element={<TagsPage />} />
        <Route exact path='/terms-condition' element={<TermsConditionPage />} />
        <Route
          exact
          path='/text-generator-new'
          element={<TextGeneratorNewPage />}
        />
        <Route exact path='/text-generator' element={<TextGeneratorPage />} />
        <Route exact path='/theme' element={<ThemePage />} />
        <Route exact path='/tooltip' element={<TooltipPage />} />
        <Route exact path='/typography' element={<TypographyPage />} />
        <Route exact path='/users-grid' element={<UsersGridPage />} />
        <Route exact path='/users-list' element={<UsersListPage />} />
        <Route exact path='/view-details' element={<ViewDetailsPage />} />
        <Route exact path='/video-generator' element={<VideoGeneratorPage />} />
        <Route exact path='/videos' element={<VideosPage />} />
        <Route exact path='/view-profile' element={<ViewProfilePage />} />
        <Route exact path='/voice-generator' element={<VoiceGeneratorPage />} />
        <Route exact path='/wallet' element={<WalletPage />} />
        <Route exact path='/widgets' element={<WidgetsPage />} />
        <Route exact path='/wizard' element={<WizardPage />} />

  </Route>

        <Route exact path='*' element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
