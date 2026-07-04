/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAccessToken } from "../lib/api/tokenStorage";
/** Converts display name to profile initials. */
function displayNameToInitials(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || "";
    const b = parts[parts.length - 1][0] || "";
    return (a + b).toUpperCase().slice(0, 2);
  }
  const w = parts[0] || s;
  return w.slice(0, 2).toUpperCase();
}

/** Active class pairs with `extra.css` sidebar (flat teal rail + active/hover tokens). */
function sidebarNavClass({ isActive }) {
  return isActive ? "active-page" : "";
}

function readProfileFromToken() {
  const t = getAccessToken();
  if (!t || typeof t !== "string") return { name: null, email: null };
  try {
    const part = t.split(".")[1];
    if (!part) return { name: null, email: null };
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    const email = typeof json.email === "string" && json.email.trim() ? json.email.trim() : null;
    const n = json.name || json.preferred_username || json.email;
    if (typeof n !== "string" || !n.trim()) return { name: null, email };
    const base = n.includes("@") ? n.split("@")[0].trim() : n.trim();
    const name = base.replace(/[._]+/g, " ").trim() || null;
    return { name, email };
  } catch {
    return { name: null, email: null };
  }
}

const MasterLayout = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const [displayName, setDisplayName] = useState("Super Admin");
  const [displayEmail, setDisplayEmail] = useState("admin@planext4u.com");
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const sync = () => {
      const { name, email } = readProfileFromToken();
      setDisplayName(name || "Super Admin");
      setDisplayEmail(email || "admin@planext4u.com");
    };
    sync();
    window.addEventListener("p4u-admin-token-updated", sync);
    return () => window.removeEventListener("p4u-admin-token-updated", sync);
  }, []);

  const profileInitials = displayNameToInitials(displayName);

  useEffect(() => {
    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");

      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = "0px"; 
        }
      });

      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = `${submenu.scrollHeight}px`; 
        }
      }
    };

    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === location.pathname ||
            link.getAttribute("to") === location.pathname
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) {
              submenu.style.maxHeight = `${submenu.scrollHeight}px`; 
            }
          }
        });
      });
    };

    openActiveDropdown();

    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname]);

  let sidebarControl = () => {
    seSidebarActive(!sidebarActive);
  };

  let mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };

  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>
      <aside
        className={
          (sidebarActive
            ? "sidebar active "
            : mobileMenu
              ? "sidebar sidebar-open"
              : "sidebar") + " p4u-sidebar-shell"
        }
      >
        <button onClick={mobileMenuControl} type='button' className='sidebar-close-btn'>
          <Icon icon='radix-icons:cross-2' />
        </button>
        <div>
          <Link
            to='/dashboard'
            className='sidebar-logo d-flex align-items-center text-decoration-none gap-12'
            aria-label='Planext4u dashboard home'
          >
            <img
              src='/assets/images/logo-icon.png'
              alt='Planext4u'
              className='sidebar-logo-mark flex-shrink-0'
              width={40}
              height={40}
            />
            <div className='sidebar-logo-copy'>
              <span className='sidebar-logo-title'>Marketplace</span>
              <span className='sidebar-logo-tagline'>Admin Console</span>
            </div>
          </Link>
        </div>

        <div className='sidebar-menu-area p4u-sidebar-menu-scroll'>
          <ul className='sidebar-menu' id='sidebar-menu'>
            
            {/* MAIN */}
            <li className='sidebar-menu-group-title'>Main</li>
            <li>
              <NavLink to='/dashboard' className={sidebarNavClass} end>
                <Icon icon='mdi:view-dashboard-outline' className='menu-icon' />
                <span>Dashboard</span>
              </NavLink>
            </li>

            {/* PRODUCT MANAGEMENT */}
            <li className='sidebar-menu-group-title'>Product Management</li>
            <li>
              <NavLink to='/product-vendors' className={sidebarNavClass}>
                <Icon icon='mdi:store-outline' className='menu-icon' />
                <span title='Vendors selling products in the Shop tab'>Product Vendors</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/product-categories' className={sidebarNavClass}>
                <Icon icon='mdi:shape-outline' className='menu-icon' />
                <span title='Shop / catalog product taxonomy'>Categories</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/subcategories' className={sidebarNavClass}>
                <Icon icon='mdi:shape-plus-outline' className='menu-icon' />
                <span>Subcategories</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/product' className={sidebarNavClass}>
                <Icon icon='mdi:package-variant-closed' className='menu-icon' />
                <span>Products</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/product-attributes' className={sidebarNavClass}>
                <Icon icon='mdi:tune-variant' className='menu-icon' />
                <span>Product Attributes</span>
              </NavLink>
            </li>

            {/* SERVICE MANAGEMENT */}
            <li className='sidebar-menu-group-title'>Service Management</li>
            <li>
              <NavLink to='/service-vendors' className={sidebarNavClass}>
                <Icon icon='mdi:room-service-outline' className='menu-icon' />
                <span title='Vendors offering bookable services in the Services tab'>Service Vendors</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/service-categories' className={sidebarNavClass}>
                <Icon icon='mdi:shape-outline' className='menu-icon' />
                <span title='Services tab booking taxonomy'>Service categories</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/service-subcategories' className={sidebarNavClass}>
                <Icon icon='mdi:shape-plus-outline' className='menu-icon' />
                <span>Service subcategories</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/service' className={sidebarNavClass}>
                <Icon icon='mdi:tools' className='menu-icon' />
                <span title='Catalog service templates and vendor listing approvals'>Services</span>
              </NavLink>
            </li>

            {/* CLASSIFIED (CF) CONFIGURATION */}
            <li className='sidebar-menu-group-title p4u-sidebar-classified-title'>Configuration</li>
            <li className='p4u-sidebar-classified-item'>
              <NavLink to='/cf-cities' className={({ isActive }) => `p4u-sidebar-classified-link ${isActive ? "active-page" : ""}`}>
                <Icon icon='mdi:map-marker-outline' className='menu-icon' />
                <span>CF City</span>
              </NavLink>
            </li>
            <li className='p4u-sidebar-classified-item'>
              <Link to='/cf-cities' className='p4u-sidebar-classified-link'>
                <Icon icon='mdi:map-outline' className='menu-icon' />
                <span>CF Area</span>
              </Link>
            </li>
            <li className='p4u-sidebar-classified-item'>
              <NavLink to='/cf-categories' className={({ isActive }) => `p4u-sidebar-classified-link ${isActive ? "active-page" : ""}`}>
                <Icon icon='mdi:tag-outline' className='menu-icon' />
                <span>CF Categories</span>
              </NavLink>
            </li>
            <li className='p4u-sidebar-classified-item'>
              <NavLink to='/cf-services' className={({ isActive }) => `p4u-sidebar-classified-link ${isActive ? "active-page" : ""}`}>
                <Icon icon='mdi:wrench-outline' className='menu-icon' />
                <span>CF Services</span>
              </NavLink>
            </li>
            <li className='p4u-sidebar-classified-item'>
              <NavLink to='/cf-products' className={({ isActive }) => `p4u-sidebar-classified-link ${isActive ? "active-page" : ""}`}>
                <Icon icon='mdi:cube-outline' className='menu-icon' />
                <span>CF Products</span>
              </NavLink>
            </li>


            {/* P4U HOMES */}
            <li className='sidebar-menu-group-title'>P4U Homes</li>

            <li>
              <NavLink to='/homes/moderation-queue' className={sidebarNavClass}>
                <Icon icon='mdi:flag-outline' className='menu-icon' />
                <span>Moderation Queue</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/homes/localities' className={sidebarNavClass}>
                <Icon icon='mdi:map-marker-radius-outline' className='menu-icon' />
                <span>Localities</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/homes/plans-pricing' className={sidebarNavClass}>
                <Icon icon='mdi:crown-outline' className='menu-icon' />
                <span>Plans & Pricing</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/homes/amenities-filters' className={sidebarNavClass}>
                <Icon icon='mdi:filter-variant' className='menu-icon' />
                <span>Amenities & Filters</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/homes/property-users' className={sidebarNavClass}>
                <Icon icon='mdi:account-group-outline' className='menu-icon' />
                <span>Property Users</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/homes/cms' className={sidebarNavClass}>
                <Icon icon='mdi:palette-outline' className='menu-icon' />
                <span>Homes CMS</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/homes/reports' className={sidebarNavClass}>
                <Icon icon='mdi:chart-bar' className='menu-icon' />
                <span>Property Reports</span>
              </NavLink>
            </li>

            {/* P4U FOOD */}
            <li className='sidebar-menu-group-title'>P4U Food</li>
            <li>
              <NavLink to='/food/restaurants' className={sidebarNavClass}>
                <Icon icon='mdi:silverware-fork-knife' className='menu-icon' />
                <span>Restaurants</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/food/riders' className={sidebarNavClass}>
                <Icon icon='mdi:bike-fast' className='menu-icon' />
                <span>Riders</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/food/rider-kyc' className={sidebarNavClass}>
                <Icon icon='mdi:account-check-outline' className='menu-icon' />
                <span>Rider KYC</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/food/rider-settlements' className={sidebarNavClass}>
                <Icon icon='mdi:bike' className='menu-icon' />
                <span>Rider Settlements</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/food/orders' className={sidebarNavClass}>
                <Icon icon='mdi:cart-outline' className='menu-icon' />
                <span>Food Orders</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/food/coupons' className={sidebarNavClass}>
                <Icon icon='mdi:ticket-percent-outline' className='menu-icon' />
                <span>Food Coupons</span>
              </NavLink>
            </li>
            {/* SALES & FINANCIALS */}
            <li className='sidebar-menu-group-title'>Finance</li>
            <li>
              <NavLink to='/orders' className={sidebarNavClass}>
                <Icon icon='mdi:clipboard-list-outline' className='menu-icon' />
                <span>Orders</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/service-bookings' className={sidebarNavClass}>
                <Icon icon='mdi:calendar-check-outline' className='menu-icon' />
                <span>Service bookings</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/settlements' className={sidebarNavClass}>
                <Icon icon='fluent:wallet-credit-card-16-regular' className='menu-icon' />
                <span>Settlements</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/points' className={sidebarNavClass}>
                <Icon icon='mdi:star-circle-outline' className='menu-icon' />
                <span>Points</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/tax' className={sidebarNavClass}>
                <Icon icon='mdi:calculator-variant-outline' className='menu-icon' />
                <span>Tax</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/vendor-plans' className={sidebarNavClass}>
                <Icon icon='mdi:wallet-membership' className='menu-icon' />
                <span>Vendor Plans</span>
              </NavLink>
            </li>

            {/* CUSTOMERS */}
            <li className='sidebar-menu-group-title'>Users</li>
            <li>
              <NavLink to='/customers' className={sidebarNavClass}>
                <Icon icon='mdi:account-group-outline' className='menu-icon' />
                <span>Customers</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/occupations' className={sidebarNavClass}>
                <Icon icon='mdi:briefcase-outline' className='menu-icon' />
                <span>Occupations</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/admin/social' className={sidebarNavClass}>
                <Icon icon='mdi:heart-outline' className='menu-icon' />
                <span>Social Dashboard</span>
              </NavLink>
            </li>

            {/* MARKETING & CONTENT */}
            <li className='sidebar-menu-group-title'>Marketing & Content</li>
            <li>
              <NavLink to='/homepage-cms' className={sidebarNavClass}>
                <Icon icon='mdi:home-edit-outline' className='menu-icon' />
                <span>Homepage CMS</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/notifications' className={sidebarNavClass}>
                <Icon icon='mdi:bullhorn-outline' className='menu-icon' />
                <span>Push Notifications</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/media-library' className={sidebarNavClass}>
                <Icon icon='mdi:folder-multiple-image' className='menu-icon' />
                <span>Media Library</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/file-uploads' className={sidebarNavClass}>
                <Icon icon='mdi:file-upload-outline' className='menu-icon' />
                <span>File Uploads</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/onboarding-screens' className={sidebarNavClass}>
                <Icon icon='mdi:monitor-screenshot' className='menu-icon' />
                <span>Onboarding Screens</span>
              </NavLink>
            </li>            <li>
              <NavLink to='/banners' className={sidebarNavClass}>
                <Icon icon='mdi:view-carousel-outline' className='menu-icon' />
                <span>Banners</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/popup-banners' className={sidebarNavClass}>
                <Icon icon='mdi:message-image-outline' className='menu-icon' />
                <span>Popup Banners</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/advertisements' className={sidebarNavClass}>
                <Icon icon='mdi:bullhorn-outline' className='menu-icon' />
                <span>Advertisements</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/cms-pages' className={sidebarNavClass}>
                <Icon icon='mdi:file-document-outline' className='menu-icon' />
                <span>CMS Pages</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/splash-screens' className={sidebarNavClass}>
                <Icon icon='mdi:cellphone-screenshot' className='menu-icon' />
                <span>Splash Screens</span>
              </NavLink>
            </li>

            {/* SYSTEM & REPORTS */}
            <li className='sidebar-menu-group-title'>Reports</li>
            <li>
              <NavLink to='/platform-variables' className={sidebarNavClass}>
                <Icon icon='mdi:cogs' className='menu-icon' />
                <span>Platform Variables</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/reports' className={sidebarNavClass}>
                <Icon icon='mdi:chart-box-outline' className='menu-icon' />
                <span>Reports</span>
              </NavLink>
            </li>
            <li>
              <NavLink to='/report-log' className={sidebarNavClass}>
                <Icon icon='mdi:file-document-alert-outline' className='menu-icon' />
                <span>Report Log</span>
              </NavLink>
            </li>


          </ul>
        </div>

        <div className='sidebar-user-footer'>
          <span className='sidebar-user-footer__avatar' aria-hidden>
            {profileInitials}
          </span>
          <div className='sidebar-user-footer__info min-w-0'>
            <div className='sidebar-user-footer__name-row'>
              <span className='sidebar-user-footer__name text-truncate'>{displayName}</span>
              <span className='sidebar-user-footer__badge'>Admin</span>
            </div>
            <span className='sidebar-user-footer__email text-truncate d-block'>{displayEmail}</span>
          </div>
          <button
            type='button'
            className='sidebar-user-footer__logout'
            onClick={handleLogout}
            aria-label='Log out'
            title='Log out'
          >
            <Icon icon='solar:logout-2-outline' className='text-xl' />
          </button>
        </div>
      </aside>

      <main className={sidebarActive ? "dashboard-main active" : "dashboard-main"}>
        <div className='navbar-header'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <div className='d-flex flex-wrap align-items-center gap-4'>
                <button type='button' className='sidebar-toggle' onClick={sidebarControl}>
                  <Icon icon={sidebarActive ? 'iconoir:arrow-right' : 'heroicons:bars-3-solid'} className='icon text-2xl' />
                </button>
                <button onClick={mobileMenuControl} type='button' className='sidebar-mobile-toggle'>
                  <Icon icon='heroicons:bars-3-solid' className='icon' />
                </button>
                <form className='navbar-search'>
                  <input type='text' name='search' placeholder='Search pages, features...' />
                  <Icon icon='ion:search-outline' className='icon' />
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className='dashboard-main-body'>{children}</div>

        <footer className='d-footer'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <p className='mb-0'>(c) 2026 P4U. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;


