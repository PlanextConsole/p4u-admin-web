import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { createAdvertisement, listProducts, updateAdvertisement, uploadFile } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";
import MediaLibraryPicker from "../../components/admin/MediaLibraryPicker";

const pageOptions = [
  { value: "all", label: "All Pages" },
  { value: "home", label: "Home Page" },
  { value: "product_listing", label: "Product Listing" },
  { value: "product_detail", label: "Product Detail" },
  { value: "services", label: "Services" },
  { value: "classifieds", label: "Classifieds" },
  { value: "socio", label: "Socio Feed" },
];

const empty = (isSocioDefault = false) => ({
  title: "",
  advertiser: "",
  description: "",
  desktopImageUrl: "",
  mobileImageUrl: "",
  linkType: isSocioDefault ? "Product" : "Custom URL",
  redirectUrl: "",
  categoryFilter: "",
  productSearch: "",
  selectedProductId: "",
  pages: isSocioDefault ? ["socio"] : ["all"],
  type: isSocioDefault ? "Sponsored Post" : "Banner",
  status: "active",
  startDate: "",
  endDate: "",
  sortOrder: 0,
});

const normalizePages = (meta, isSocioDefault = false) => {
  const raw = meta?.pages;
  if (Array.isArray(raw) && raw.length) return raw;
  if (typeof raw === "string" && raw.trim()) return raw.split(",").map((x) => x.trim()).filter(Boolean);
  return meta?.isSocioAd || isSocioDefault ? ["socio"] : ["all"];
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const AdvertisementFormLayer = ({ isEdit = false, isView = false, isSocioDefault = false, initialData = null, onSuccess, onCancel }) => {
  const [form, setForm] = useState(() => empty(isSocioDefault));
  const [products, setProducts] = useState([]);
  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Which image slot ('desktop' | 'mobile') the Media Library picker is choosing for.
  const [pickerFor, setPickerFor] = useState(null);
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    listProducts({ limit: 80, offset: 0 }).then((res) => {
      if (alive) setProducts(res.items || []);
    }).catch(() => {
      if (alive) setProducts([]);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (initialData) {
      const meta = initialData.metadata || {};
      setForm({
        title: initialData.title || "",
        advertiser: meta.advertiser || "",
        description: meta.caption || meta.description || "",
        desktopImageUrl: meta.desktopImageUrl || initialData.imageUrl || "",
        mobileImageUrl: meta.mobileImageUrl || "",
        linkType: meta.linkType || (initialData.redirectUrl ? "Custom URL" : "Product"),
        redirectUrl: initialData.redirectUrl || "",
        categoryFilter: meta.categoryFilter || "",
        productSearch: "",
        selectedProductId: meta.selectedProductId || "",
        pages: normalizePages(meta, isSocioDefault),
        type: meta.type || meta.postType || (meta.isSocioAd ? "Sponsored Post" : "Banner"),
        status: String(initialData.status || "active").toLowerCase() === "inactive" ? "paused" : String(initialData.status || "active").toLowerCase(),
        startDate: toDateInput(meta.startDate),
        endDate: toDateInput(meta.endDate),
        sortOrder: initialData.sortOrder ?? 0,
      });
    } else {
      setForm(empty(isSocioDefault));
    }
    setDesktopFile(null);
    setMobileFile(null);
    desktopRef.current = null;
    mobileRef.current = null;
  }, [initialData, isSocioDefault]);

  const disabled = isView || submitting;

  const filteredProducts = useMemo(() => {
    const q = form.productSearch.trim().toLowerCase();
    const category = form.categoryFilter.trim().toLowerCase();
    return products.filter((product) => {
      const categoryText = [product.categoryName, product.category, product.categorySlug, product.vendorName].filter(Boolean).join(" ").toLowerCase();
      const haystack = [product.name, product.title, product.productName, product.vendorName, product.id].filter(Boolean).join(" ").toLowerCase();
      return (!q || haystack.includes(q)) && (!category || categoryText.includes(category));
    }).slice(0, 6);
  }, [form.categoryFilter, form.productSearch, products]);

  const setField = (name, value) => {
    if (disabled) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePage = (page) => {
    if (disabled) return;
    setForm((prev) => {
      if (page === "all") return { ...prev, pages: ["all"] };
      const withoutAll = prev.pages.filter((value) => value !== "all");
      const pages = withoutAll.includes(page)
        ? withoutAll.filter((value) => value !== page)
        : [...withoutAll, page];
      return { ...prev, pages: pages.length ? pages : ["all"] };
    });
  };

  const pickDesktop = (event) => {
    if (disabled) return;
    const file = event.target.files && event.target.files[0];
    if (file) {
      desktopRef.current = file;
      setDesktopFile(file);
    }
  };

  const pickMobile = (event) => {
    if (disabled) return;
    const file = event.target.files && event.target.files[0];
    if (file) {
      mobileRef.current = file;
      setMobileFile(file);
    }
  };

  const uploadIfNeeded = async (file, fallback) => {
    if (!file) return fallback;
    const result = await uploadFile(file);
    return result.url;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isView) return;

    const title = form.title.trim();
    if (!title) {
      toast.error("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const desktopImageUrl = await uploadIfNeeded(desktopRef.current || desktopFile, form.desktopImageUrl);
      const mobileImageUrl = await uploadIfNeeded(mobileRef.current || mobileFile, form.mobileImageUrl);
      const metadata = {
        advertiser: form.advertiser.trim(),
        caption: form.description.trim(),
        description: form.description.trim(),
        desktopImageUrl,
        mobileImageUrl,
        linkType: form.linkType,
        linkLabel: form.linkType === "Product" ? "Product" : "Custom",
        categoryFilter: form.categoryFilter.trim(),
        selectedProductId: form.selectedProductId,
        pages: form.pages,
        isSocioAd: form.pages.includes("socio"),
        type: form.type,
        postType: form.type,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        impressions: initialData?.metadata?.impressions ?? 0,
        clicks: initialData?.metadata?.clicks ?? 0,
      };
      const body = {
        title,
        imageUrl: desktopImageUrl || null,
        redirectUrl: form.linkType === "Product" && form.selectedProductId ? `/app/product/${form.selectedProductId}` : (form.redirectUrl.trim() || null),
        status: form.status === "paused" ? "inactive" : form.status,
        sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
        metadata,
      };
      if (isEdit && initialData?.id) {
        await updateAdvertisement(initialData.id, body);
        toast.success("Advertisement updated.");
      } else {
        await createAdvertisement(body);
        toast.success("Advertisement created.");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderDropzone = ({ label, value, file, onChange, slot }) => (
    <>
      <label className='p4u-ad-upload'>
        <input type='file' accept={IMAGE_ACCEPT} onChange={onChange} disabled={disabled} />
        {value ? <img src={resolveMediaUrl(value)} alt={label} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
        <Icon icon='lucide:image' />
        <span>{file ? file.name : label}</span>
        <small>Click to upload from your device</small>
      </label>
      {!disabled ? (
        <button type='button' className='p4u-ad-library-btn' onClick={() => setPickerFor(slot)}>
          <Icon icon='mdi:folder-image' /> Choose from Media Library
        </button>
      ) : null}
    </>
  );

  const applyLibrarySelection = (url) => {
    if (pickerFor === "desktop") {
      desktopRef.current = null;
      setDesktopFile(null);
      setField("desktopImageUrl", url);
    } else if (pickerFor === "mobile") {
      mobileRef.current = null;
      setMobileFile(null);
      setField("mobileImageUrl", url);
    }
    setPickerFor(null);
  };

  return (
    <form className='p4u-ad-modal' onSubmit={handleSubmit}>
      <h2>{isView ? "View Advertisement" : isEdit ? "Edit Advertisement" : "New Advertisement"}</h2>

      <div className='p4u-ad-grid'>
        <label className='p4u-ad-field'>
          <span>Title *</span>
          <input value={form.title} onChange={(event) => setField("title", event.target.value)} disabled={disabled} required autoFocus={!isView} />
        </label>
        <label className='p4u-ad-field'>
          <span>Advertiser</span>
          <input value={form.advertiser} onChange={(event) => setField("advertiser", event.target.value)} disabled={disabled} />
        </label>
      </div>

      <div className='p4u-ad-field is-full'>
        <span>Description</span>
        <div className='p4u-ad-editor'>
          <div className='p4u-ad-editor-tools'>
            <Icon icon='mdi:format-bold' />
            <Icon icon='mdi:format-italic' />
            <Icon icon='mdi:format-underline' />
            <Icon icon='mdi:format-list-bulleted' />
            <Icon icon='mdi:format-list-numbered' />
            <span />
            <Icon icon='lucide:pencil' className='is-teal' />
            <Icon icon='lucide:eye' />
          </div>
          <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} disabled={disabled} placeholder='Advertisement description...' />
        </div>
      </div>

      <div className='p4u-ad-grid'>
        <div className='p4u-ad-drop-field'>
          <span>Desktop Image</span>
          {renderDropzone({ label: "Desktop", value: form.desktopImageUrl, file: desktopFile, onChange: pickDesktop, slot: "desktop" })}
        </div>
        <div className='p4u-ad-drop-field'>
          <span>Mobile Image</span>
          {renderDropzone({ label: "Mobile", value: form.mobileImageUrl, file: mobileFile, onChange: pickMobile, slot: "mobile" })}
        </div>
      </div>

      <section className='p4u-ad-destination'>
        <h3>Click Destination</h3>
        <label className='p4u-ad-field is-full'>
          <select value={form.linkType} onChange={(event) => setField("linkType", event.target.value)} disabled={disabled}>
            <option>Custom URL</option>
            <option>Product</option>
            <option>Category</option>
            <option>Service</option>
            <option>No link</option>
          </select>
        </label>
        {form.linkType === "Product" ? (
          <>
            <div className='p4u-ad-grid is-destination'>
              <label className='p4u-ad-field'>
                <select value={form.categoryFilter} onChange={(event) => setField("categoryFilter", event.target.value)} disabled={disabled}>
                  <option value=''>Filter by category</option>
                  <option value='combo offers'>Combo Offers</option>
                  <option value='beauty'>Beauty & Personal Care</option>
                  <option value='electronics'>Electronics & Gadgets</option>
                  <option value='groceries'>Groceries</option>
                </select>
              </label>
              <label className='p4u-ad-search-product'>
                <Icon icon='ion:search-outline' />
                <input value={form.productSearch} onChange={(event) => setField("productSearch", event.target.value)} placeholder='Search product...' disabled={disabled} />
              </label>
            </div>
            <div className='p4u-ad-product-list'>
              {filteredProducts.length ? filteredProducts.map((product) => {
                const name = product.name || product.title || product.productName || product.id;
                const detail = [product.categoryName || product.category || product.categorySlug, product.vendorName || product.vendor?.businessName].filter(Boolean).join(" · ");
                return (
                  <button
                    key={product.id}
                    type='button'
                    className={form.selectedProductId === product.id ? "is-selected" : ""}
                    onClick={() => setField("selectedProductId", product.id)}
                    disabled={disabled}
                  >
                    {name}{detail ? <span> ({detail})</span> : null}
                  </button>
                );
              }) : <p>No products found.</p>}
            </div>
          </>
        ) : (
          <label className='p4u-ad-field is-full'>
            <span>Custom URL</span>
            <input value={form.redirectUrl} onChange={(event) => setField("redirectUrl", event.target.value)} disabled={disabled || form.linkType === "No link"} placeholder='/app/browse or https://...' />
          </label>
        )}
      </section>

      <section className='p4u-ad-pages'>
        <span>Display on Pages</span>
        <div>
          {pageOptions.map((page) => (
            <button key={page.value} type='button' className={form.pages.includes(page.value) ? "is-selected" : ""} onClick={() => togglePage(page.value)} disabled={disabled}>
              <i>{form.pages.includes(page.value) ? <Icon icon='lucide:check' /> : null}</i>
              {page.label}
            </button>
          ))}
        </div>
      </section>

      <div className='p4u-ad-grid is-four'>
        <label className='p4u-ad-field'>
          <span>Type</span>
          <select value={form.type} onChange={(event) => setField("type", event.target.value)} disabled={disabled}>
            <option>Banner</option>
            <option>Sidebar</option>
            <option>Sponsored Post</option>
            <option>Strip</option>
          </select>
        </label>
        <label className='p4u-ad-field'>
          <span>Status</span>
          <select value={form.status} onChange={(event) => setField("status", event.target.value)} disabled={disabled}>
            <option value='active'>Active</option>
            <option value='paused'>Paused</option>
            <option value='inactive'>Inactive</option>
          </select>
        </label>
        <label className='p4u-ad-field'>
          <span>Start Date</span>
          <input type='date' value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} disabled={disabled} />
        </label>
        <label className='p4u-ad-field'>
          <span>End Date</span>
          <input type='date' value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} disabled={disabled} />
        </label>
      </div>

      <div className='p4u-ad-footer'>
        <button type='button' className='p4u-ad-cancel' onClick={() => (onCancel ? onCancel() : window.history.back())}>{isView ? "Back" : "Cancel"}</button>
        {!isView && <button type='submit' className='p4u-ad-submit' disabled={disabled}>{submitting ? "Saving..." : isEdit ? "Save" : "Create"}</button>}
      </div>

      <MediaLibraryPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={applyLibrarySelection}
        title={pickerFor === "mobile" ? "Choose mobile image" : "Choose desktop image"}
      />
    </form>
  );
};

export default AdvertisementFormLayer;
