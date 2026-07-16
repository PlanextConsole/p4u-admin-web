import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  createProduct,
  getProduct,
  listCategoriesForProducts,
  listProductAttributes,
  listTaxConfigurations,
  listVendors,
  updateProduct,
  uploadFile,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";
import ImageUploadField from "../../components/admin/ImageUploadField";

function parseMeta(v) {
  if (!v) return {};
  if (typeof v === "string") {
    try { return JSON.parse(v) || {}; } catch { return {}; }
  }
  return typeof v === "object" && !Array.isArray(v) ? v : {};
}

function normalizeAttrSelections(raw) {
  if (!raw || typeof raw !== "object") return {};
  return Object.entries(raw).reduce((acc, [k, v]) => {
    if (Array.isArray(v)) {
      acc[k] = v.map((x) => String(x)).filter(Boolean);
      return acc;
    }
    if (v == null || v === "") {
      acc[k] = [];
      return acc;
    }
    acc[k] = [String(v)];
    return acc;
  }, {});
}

function splitLabelAndHex(value) {
  const s = String(value || "").trim();
  const m = s.match(/^(.*?)(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))$/);
  if (!m) return { label: s, hex: null };
  const label = String(m[1] || "").trim();
  return { label: label || s, hex: m[2] };
}

function normalizeBannerUrls(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((x) => String(x || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      return normalizeBannerUrls(JSON.parse(value));
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
}

function collectProductImageUrls(thumbnailUrl, bannerUrls) {
  const seen = new Set();
  const out = [];
  const push = (url) => {
    const u = String(url || "").trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  push(thumbnailUrl);
  normalizeBannerUrls(bannerUrls).forEach(push);
  return out;
}

function cartesianCombinations(attrs) {
  const keys = Object.keys(attrs).filter((k) => (attrs[k] || []).length > 0);
  if (!keys.length) return [];
  return keys.reduce((acc, key) => {
    const vals = attrs[key];
    if (!acc.length) return vals.map((v) => ({ [key]: v }));
    const out = [];
    for (const row of acc) {
      for (const v of vals) out.push({ ...row, [key]: v });
    }
    return out;
  }, []);
}

function attrsKey(attrs) {
  return Object.keys(attrs)
    .sort()
    .map((k) => `${k}=${attrs[k]}`)
    .join("|");
}

const emptyForm = () => ({
  name: "",
  productRef: "",
  sku: "",
  availability: "Yes",
  vendorId: "",
  parentCategoryId: "",
  categoryId: "",
  productType: "simple",
  sellPrice: "",
  discountAmount: "",
  finalPrice: "",
  taxConfigurationId: "",
  hsnCode: "",
  taxAmount: "",
  discountType: "Fixed",
  quantity: "",
  maxPointsRedeemable: "",
  maxUserRedemptionPercent: "",
  vendorCommissionLabel: "Vendor default",
  commissionOverridePercent: "",
  shortDescription: "",
  longDescription: "",
  statusLabel: "Active",
  dealOfDay: "No",
  specVolume: "",
  specPackSize: "",
  seoTitle: "",
  seoDescription: "",
  thumbnailUrl: "",
  bannerUrls: [],
});

const ProductFormLayer = ({ isEdit = false, isView = false, productId, onSuccess, onCancel, onDelete }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("general");
  const [isReadonly, setIsReadonly] = useState(Boolean(isView));
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxItems, setTaxItems] = useState([]);
  const [attributeDefs, setAttributeDefs] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [variations, setVariations] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [entityLoading, setEntityLoading] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingThumbnail, setPendingThumbnail] = useState(null);
  const pendingThumbnailRef = useRef(null);

  const pendingPreviewUrl = useMemo(
    () => (pendingThumbnail ? URL.createObjectURL(pendingThumbnail) : null),
    [pendingThumbnail],
  );

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRefsLoading(true);
      try {
        const [vRes, cRes, tRes, aRes] = await Promise.all([
          listVendors({ limit: 300, offset: 0, vendorKind: "product" }),
          listCategoriesForProducts({ purpose: "all" }),
          listTaxConfigurations({ purpose: "all" }),
          listProductAttributes({ limit: 500, offset: 0 }),
        ]);
        if (!cancelled) {
          setVendors(vRes.items || []);
          setCategories(cRes.items || []);
          setTaxItems(tRes.items || []);
          setAttributeDefs((aRes.items || []).filter((a) => a.isActive !== false));
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof ApiError ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setRefsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const applyRow = useCallback((row) => {
    const meta = parseMeta(row.metadata || row.metaJson || row.extraJson);
    const productAttrs = normalizeAttrSelections(meta.productAttributes || meta.attributes || {});
    setSelectedAttributes(productAttrs);
    const bannerUrls = normalizeBannerUrls(row.bannerUrls);
    const thumbnailUrl = row.thumbnailUrl || bannerUrls[0] || "";
    setFormData({
      name: row.name || "",
      productRef: row.productRef || `PRD-${String(row.id || "").slice(-6)}`,
      sku: meta.sku || row.sku || "",
      availability: row.availability || row.isActive ? "Yes" : "No",
      vendorId: row.vendorId || "",
      categoryId: row.categoryId || "",
      productType: meta.productType || "simple",
      sellPrice: row.sellPrice != null ? String(row.sellPrice) : String(row.price || ""),
      discountAmount: row.discountAmount != null ? String(row.discountAmount) : "",
      finalPrice: row.finalPrice != null ? String(row.finalPrice) : "",
      taxConfigurationId: row.taxConfigurationId || "",
      hsnCode: meta.hsnCode || "",
      taxAmount: meta.taxAmount != null ? String(meta.taxAmount) : "",
      discountType: meta.discountType || "Fixed",
      quantity: meta.quantity != null ? String(meta.quantity) : "",
      maxPointsRedeemable: meta.maxPointsRedeemable != null ? String(meta.maxPointsRedeemable) : "",
      maxUserRedemptionPercent: meta.maxUserRedemptionPercent != null ? String(meta.maxUserRedemptionPercent) : "",
      vendorCommissionLabel: meta.vendorCommissionLabel || "Vendor default",
      commissionOverridePercent: row.commissionOverridePercent != null ? String(row.commissionOverridePercent) : "",
      shortDescription: row.shortDescription || "",
      longDescription: row.longDescription || "",
      statusLabel: row.availability || row.isActive ? "Active" : "Inactive",
      dealOfDay: meta.dealOfDay || "No",
      specVolume: meta.specVolume || "",
      specPackSize: meta.specPackSize || "",
      seoTitle: meta.seoTitle || "",
      seoDescription: meta.seoDescription || "",
      thumbnailUrl,
      bannerUrls,
    });
    const loaded = Array.isArray(row.variations) ? row.variations : [];
    setVariations(
      loaded.map((v) => ({
        id: v.id,
        sku: v.sku || "",
        attributes: v.attributes || {},
        sellPrice: String(v.sellPrice ?? ""),
        discountAmount: String(v.discountAmount ?? "0"),
        finalPrice: String(v.finalPrice ?? v.sellPrice ?? ""),
        quantity: String(v.quantity ?? 0),
        isActive: v.isActive !== false,
      })),
    );
  }, []);

  const toggleSelectAttribute = (attrName, option) => {
    if (isReadonly) return;
    setSelectedAttributes((prev) => {
      const curr = Array.isArray(prev[attrName]) ? prev[attrName] : [];
      const next = curr.includes(option) ? curr.filter((v) => v !== option) : [...curr, option];
      return { ...prev, [attrName]: next };
    });
  };

  const setScalarAttribute = (attrName, value) => {
    if (isReadonly) return;
    setSelectedAttributes((prev) => ({
      ...prev,
      [attrName]: value ? [String(value)] : [],
    }));
  };

  const generateVariationsFromAttributes = () => {
    const combos = cartesianCombinations(selectedAttributes);
    if (!combos.length) {
      toast.error("Select attribute values before generating variations.");
      setActiveTab("attributes");
      return;
    }
    const sell = formData.sellPrice.trim() || "0";
    const fin = formData.finalPrice.trim() || sell;
    const disc = formData.discountAmount.trim() || "0";
    const stock = formData.quantity.trim() || "0";
    setVariations((prev) => {
      const byKey = new Map(prev.map((r) => [attrsKey(r.attributes), r]));
      return combos.map((attributes) => {
        const existing = byKey.get(attrsKey(attributes));
        return (
          existing || {
            attributes,
            sku: "",
            sellPrice: sell,
            discountAmount: disc,
            finalPrice: fin,
            quantity: stock,
            isActive: true,
          }
        );
      });
    });
    setActiveTab("variations");
  };

  const updateVariationRow = (index, patch) => {
    if (isReadonly) return;
    setVariations((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  const subcategories = useMemo(() => {
    if (!formData.parentCategoryId) return [];
    return categories.filter((c) => c.parentId === formData.parentCategoryId);
  }, [categories, formData.parentCategoryId]);

  useEffect(() => {
    if (!formData.categoryId || !categories.length) return;
    const chosen = categories.find((c) => c.id === formData.categoryId);
    if (!chosen) return;
    if (chosen.parentId) {
      setFormData((prev) =>
        prev.parentCategoryId === chosen.parentId ? prev : { ...prev, parentCategoryId: chosen.parentId || "" },
      );
    } else {
      setFormData((prev) =>
        prev.parentCategoryId === chosen.id ? prev : { ...prev, parentCategoryId: chosen.id },
      );
    }
  }, [formData.categoryId, categories]);

  useEffect(() => {
    if (!productId) {
      setEntityLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setEntityLoading(true);
      setLoadError("");
      try {
        const row = await getProduct(productId);
        if (!cancelled) applyRow(row);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : String(e));
      } finally {
        if (!cancelled) setEntityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId, applyRow]);

  useEffect(() => {
    setIsReadonly(Boolean(isView));
  }, [isView]);

  const handleChange = (e) => {
    if (isReadonly) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadonly) return;

    let thumbnailUrl = formData.thumbnailUrl;
    let bannerUrls = [...normalizeBannerUrls(formData.bannerUrls)];
    const thumbFile = pendingThumbnailRef.current || pendingThumbnail;
    if (thumbFile) {
      try {
        const res = await uploadFile(thumbFile);
        thumbnailUrl = res.url;
        if (!bannerUrls.includes(res.url)) {
          bannerUrls = [res.url, ...bannerUrls.filter((u) => u !== res.url)];
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Thumbnail upload failed");
        return;
      }
    }

    if (!formData.vendorId?.trim()) {
      toast.error("Select product vendor.");
      return;
    }
    if (!formData.parentCategoryId?.trim()) {
      toast.error("Select category.");
      return;
    }
    if (subcategories.length > 0 && !formData.categoryId?.trim()) {
      toast.error("Select subcategory.");
      return;
    }
    const effectiveCategoryId =
      subcategories.length > 0 ? formData.categoryId : formData.parentCategoryId;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim() || null,
        availability: formData.availability === "Yes",
        isActive: formData.availability === "Yes",
        moderationStatus: formData.availability === "Yes" ? "approved" : "pending",
        vendorId: formData.vendorId || null,
        categoryId: effectiveCategoryId || null,
        serviceId: null,
        sellPrice: formData.sellPrice || null,
        discountAmount: formData.discountAmount || null,
        finalPrice: formData.finalPrice || null,
        taxConfigurationId: formData.taxConfigurationId || null,
        commissionOverridePercent: formData.commissionOverridePercent !== "" ? Number(formData.commissionOverridePercent) : null,
        shortDescription: formData.shortDescription.trim() || null,
        longDescription: formData.longDescription.trim() || null,
        thumbnailUrl: thumbnailUrl || bannerUrls[0] || null,
        bannerUrls: bannerUrls.length > 0 ? bannerUrls : null,
        metadata: {
          sku: formData.sku || null,
          productType: formData.productType || "simple",
          hsnCode: formData.hsnCode || null,
          taxAmount: formData.taxAmount || null,
          discountType: formData.discountType || null,
          quantity: formData.quantity !== "" ? Number(formData.quantity) : null,
          maxPointsRedeemable: formData.maxPointsRedeemable || null,
          maxUserRedemptionPercent: formData.maxUserRedemptionPercent || null,
          vendorCommissionLabel: formData.vendorCommissionLabel || null,
          dealOfDay: formData.dealOfDay || "No",
          specVolume: formData.specVolume || null,
          specPackSize: formData.specPackSize || null,
            productAttributes: selectedAttributes,
          seoTitle: formData.seoTitle || null,
          seoDescription: formData.seoDescription || null,
        },
        ...(formData.productType === "variable"
          ? {
              variations: variations.map((v, idx) => ({
                ...(v.id ? { id: v.id } : {}),
                sku: v.sku.trim() || null,
                attributes: v.attributes,
                sellPrice: v.sellPrice.trim() || formData.sellPrice || "0",
                discountAmount: v.discountAmount.trim() || "0",
                finalPrice: v.finalPrice.trim() || v.sellPrice.trim() || formData.finalPrice || formData.sellPrice || "0",
                quantity: Number(v.quantity) || 0,
                isActive: v.isActive !== false,
                sortOrder: idx,
              })),
            }
          : {}),
      };

      if (isEdit && productId) {
        await updateProduct(productId, payload);
        toast.success("Product updated.");
      } else {
        await createProduct(payload);
        toast.success("Product created.");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isReadonly || submitting || refsLoading || entityLoading;
  const showSkeleton = Boolean(productId) && entityLoading;
  const inModal = Boolean(onCancel);
  const productImageUrls = useMemo(
    () => collectProductImageUrls(formData.thumbnailUrl, formData.bannerUrls),
    [formData.thumbnailUrl, formData.bannerUrls],
  );
  const vendorName = vendors.find((v) => v.id === formData.vendorId)?.businessName || "—";
  const categoryName = categories.find((c) => c.id === formData.categoryId)?.name || "—";

  const modalTitle = () => {
    const name = formData.name?.trim();
    if (isEdit && name) return `Edit: ${name}`;
    if (isEdit) return "Edit Product";
    return "New Product";
  };

  return (
    <div className={inModal ? "p4u-product-modal" : "card h-100 p-0 radius-16 border-0"}>
      <div className={inModal ? "" : "card-body p-20"}>
        {loadError && <div className="alert alert-danger radius-12 mb-16">{loadError}</div>}
        {showSkeleton ? (
          <p className="text-secondary-light mb-0">Loading product...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p4u-product-modal__head">
              <span className="p4u-product-modal__icon">
                <Icon icon="mdi:package-variant-closed" />
              </span>
              <div>
                <h4 className="p4u-product-modal__title">{modalTitle()}</h4>
                {formData.productRef ? <p className="p4u-product-modal__ref">{formData.productRef}</p> : null}
              </div>
            </div>

            {!inModal && (
              <div className="d-flex flex-wrap align-items-center gap-8 mb-16">
                <span className="px-12 py-4 rounded-pill bg-success-focus text-success-main fw-semibold text-sm">{formData.statusLabel}</span>
                <span className="px-12 py-4 rounded-pill bg-neutral-200 text-secondary-light fw-semibold text-sm">{formData.productType}</span>
                <span className="text-secondary-light"><Icon icon="mdi:tag-outline" className="me-4" />{categoryName}</span>
                <span className="text-secondary-light"><Icon icon="mdi:store-outline" className="me-4" />{vendorName}</span>
              </div>
            )}

            <div className="p4u-product-tabs">
              <Tab active={activeTab === "general"} label="General" onClick={() => setActiveTab("general")} />
              <Tab active={activeTab === "pricing"} label="Pricing" onClick={() => setActiveTab("pricing")} />
              <Tab active={activeTab === "attributes"} label="Attributes" onClick={() => setActiveTab("attributes")} />
              {formData.productType === "variable" ? (
                <Tab active={activeTab === "variations"} label="Variations" onClick={() => setActiveTab("variations")} />
              ) : null}
              <Tab active={activeTab === "seo"} label="SEO" onClick={() => setActiveTab("seo")} />
            </div>

            {activeTab === "general" && (
              <section className="d-flex flex-column gap-14">
                <div className="p4u-product-type-grid">
                  {[
                    { value: "simple", label: "Simple", icon: "mdi:layers-outline" },
                    { value: "variable", label: "Variable", icon: "mdi:layers-triple-outline" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      className={`p4u-product-type-card ${formData.productType === opt.value ? "is-active" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, productType: opt.value }))}
                    >
                      <Icon icon={opt.icon} className="text-xl" />
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="p4u-product-form-box">
                  <h6>Product Images</h6>
                  {!isReadonly && (
                    <ImageUploadField
                      disabled={disabled}
                      accept={IMAGE_ACCEPT}
                      libraryTitle="Choose product image"
                      onFileSelect={(f) => {
                        setPendingThumbnail(f);
                        pendingThumbnailRef.current = f;
                      }}
                      onLibrarySelect={(url) => {
                        setPendingThumbnail(null);
                        pendingThumbnailRef.current = null;
                        setFormData((prev) => {
                          const banners = normalizeBannerUrls(prev.bannerUrls);
                          const nextBanners = banners.includes(url) ? banners : [url, ...banners];
                          return { ...prev, thumbnailUrl: url, bannerUrls: nextBanners };
                        });
                      }}
                    />
                  )}
                  <div className='d-flex flex-wrap align-items-center gap-10'>
                    {pendingPreviewUrl ? (
                      <img src={pendingPreviewUrl} alt='New product upload' style={{ width: 96, height: 96, borderRadius: 10, objectFit: "cover" }} />
                    ) : null}
                    {productImageUrls.length > 0 ? (
                      productImageUrls.map((url) => (
                        <img
                          key={url}
                          src={resolveMediaUrl(url)}
                          alt='Product'
                          style={{ width: 96, height: 96, borderRadius: 10, objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ))
                    ) : !pendingPreviewUrl ? (
                      <span className='text-secondary-light'>No image selected</span>
                    ) : null}
                  </div>
                </div>

                <div className="p4u-product-form-box">
                  <div className="row g-12">
                    <Field col="col-md-6" label="Title *"><input className="form-control" name="name" value={formData.name} onChange={handleChange} disabled={disabled} placeholder="Product name" /></Field>
                    <Field col="col-md-6" label="SKU"><input className="form-control" name="sku" value={formData.sku} onChange={handleChange} disabled={disabled} placeholder="SKU-001" /></Field>
                    <Field col="col-md-4" label="Vendor">
                      <select className="form-select" name="vendorId" value={formData.vendorId} onChange={handleChange} disabled={disabled}>
                        <option value="">Select vendor</option>
                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.businessName || v.ownerName}</option>)}
                      </select>
                    </Field>
                    <Field col="col-md-4" label="Category">
                      <select
                        className="form-select"
                        name="parentCategoryId"
                        value={formData.parentCategoryId}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((prev) => ({ ...prev, parentCategoryId: value, categoryId: "" }));
                        }}
                        disabled={disabled}
                      >
                        <option value="">Select category</option>
                        {rootCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </Field>
                    <Field col="col-md-4" label={subcategories.length > 0 ? "Subcategory *" : "Subcategory"}>
                      {subcategories.length === 0 && formData.parentCategoryId ? (
                        <p className="text-secondary-light text-xs mb-8">No subcategories for this category — product links to the category directly.</p>
                      ) : null}
                      <select
                        className="form-select"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        disabled={disabled || !formData.parentCategoryId || subcategories.length === 0}
                      >
                        <option value="">
                          {!formData.parentCategoryId
                            ? "Select category first"
                            : subcategories.length === 0
                              ? "N/A"
                              : "Select subcategory"}
                        </option>
                        {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </Field>
                    <Field col="col-md-4" label="Quantity">
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        disabled={disabled}
                        placeholder="Available stock"
                      />
                    </Field>
                  </div>
                </div>

                <div className="row g-12">
                  <Field col="col-md-6" label="Short Description"><textarea className="form-control" name="shortDescription" rows={3} value={formData.shortDescription} onChange={handleChange} disabled={disabled} placeholder="Brief one-liner" /></Field>
                  <Field col="col-md-6" label="Long Description"><textarea className="form-control" name="longDescription" rows={3} value={formData.longDescription} onChange={handleChange} disabled={disabled} placeholder="Detailed product description..." /></Field>
                </div>
                <div className="p4u-product-deal-box">
                  <div>
                    <h6><Icon icon="mdi:star-outline" className="me-1" /> Deal of the Day</h6>
                    <p>Featured in homepage &quot;Deals of the Day&quot;</p>
                  </div>
                  <select className="form-select" style={{ width: 140 }} name="dealOfDay" value={formData.dealOfDay} onChange={handleChange} disabled={disabled}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </section>
            )}

            {activeTab === "pricing" && (
              <section className="d-flex flex-column gap-14">
                <div className="p4u-product-form-box">
                  <h5><Icon icon="mdi:currency-inr" className="me-1" /> Pricing</h5>
                  <div className="row g-12">
                    <Field col="col-md-6" label="MRP (₹)"><input className="form-control" name="sellPrice" value={formData.sellPrice} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col="col-md-6" label="Tax Slab">
                      <select className="form-select" name="taxConfigurationId" value={formData.taxConfigurationId} onChange={handleChange} disabled={disabled}>
                        <option value="">Select tax</option>
                        {taxItems.map((t) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.percentage}%)</option>)}
                      </select>
                    </Field>
                    <Field col="col-md-6" label="HSN Code"><input className="form-control" name="hsnCode" value={formData.hsnCode} onChange={handleChange} disabled={disabled} placeholder="e.g. 84713010" /></Field>
                    <Field col="col-md-6" label="Tax Amount (auto)"><input className="form-control" name="taxAmount" value={formData.taxAmount} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col="col-md-6" label="Discount Type">
                      <select className="form-select" name="discountType" value={formData.discountType} onChange={handleChange} disabled={disabled}>
                        <option value="Fixed">Fixed (₹)</option>
                        <option value="Percent">Percent</option>
                      </select>
                    </Field>
                    <Field col="col-md-6" label="Discount (₹)"><input className="form-control" name="discountAmount" value={formData.discountAmount} onChange={handleChange} disabled={disabled} /></Field>
                  </div>
                  <div className="p4u-product-pricing-summary">
                    <h5 className="mb-0 fw-bold">Selling Price</h5>
                    <h3 className="mb-0 fw-bold">₹{formData.finalPrice || formData.sellPrice || 0}</h3>
                  </div>
                </div>

                <div className="p4u-product-commission-box">
                  <div className="row g-12">
                    <Field col="col-md-4" label="Max Points Redeemable"><input type="number" min="0" step="1" className="form-control" name="maxPointsRedeemable" value={formData.maxPointsRedeemable} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col="col-md-4" label="Max User Redemption %"><input type="number" min="0" max="100" step="0.01" className="form-control" name="maxUserRedemptionPercent" value={formData.maxUserRedemptionPercent} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col="col-md-4" label="Vendor to P4U Commission"><input className="form-control" name="vendorCommissionLabel" value={formData.vendorCommissionLabel} onChange={handleChange} disabled={disabled} /></Field>
                    <Field col="col-md-4" label="Commission Override % (this product)">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="form-control"
                        name="commissionOverridePercent"
                        value={formData.commissionOverridePercent}
                        onChange={handleChange}
                        disabled={disabled}
                        placeholder="Leave blank to use category/vendor/plan"
                      />
                    </Field>
                  </div>
                  <p className="text-secondary-light text-sm mb-0 mt-8">Product-level values override vendor-level, which overrides plan-level.</p>
                </div>
              </section>
            )}

            {activeTab === "attributes" && (
              <section className="p4u-product-form-box">
                <h5 className="fw-bold mb-12">Attributes</h5>
                <p className="text-secondary-light text-sm mb-16">Select attribute values for this product. For variable products, variants will be generated from selected combinations.</p>
                {formData.productType === "variable" ? (
                  <div className='d-flex flex-wrap align-items-center justify-content-between gap-8 mb-16 p-12 rounded-12 border border-primary-200 bg-primary-50'>
                    <p className='mb-0 text-sm text-secondary-light'>Select values, then generate SKU rows on the Variations tab.</p>
                    <button type='button' className='btn btn-primary btn-sm radius-10' onClick={generateVariationsFromAttributes} disabled={disabled}>
                      Generate variations
                    </button>
                  </div>
                ) : null}
                {attributeDefs.length === 0 ? (
                  <p className='text-secondary-light mb-0'>No active product attributes found.</p>
                ) : (
                  <div className='d-flex flex-column gap-16'>
                    {attributeDefs.map((attr) => {
                      const values = Array.isArray(attr.selectValues) ? attr.selectValues : [];
                      const selected = Array.isArray(selectedAttributes[attr.name]) ? selectedAttributes[attr.name] : [];
                      return (
                        <div key={attr.id}>
                          <label className='form-label fw-semibold text-primary-light text-md mb-8'>{attr.name}</label>
                          {attr.type === "select" ? (
                            <div className='d-flex flex-wrap gap-8'>
                              {values.map((opt) => {
                                const { label, hex } = splitLabelAndHex(opt);
                                const active = selected.includes(opt);
                                return (
                                  <button
                                    key={`${attr.id}-${opt}`}
                                    type='button'
                                    onClick={() => toggleSelectAttribute(attr.name, opt)}
                                    disabled={disabled}
                                    className={`p4u-product-attr-chip ${active ? "is-active" : ""}`}
                                  >
                                    {hex ? (
                                      <span
                                        style={{
                                          width: 16,
                                          height: 16,
                                          borderRadius: "50%",
                                          border: "1px solid #d1d5db",
                                          backgroundColor: hex,
                                        }}
                                      />
                                    ) : null}
                                    <span>{label || opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <input
                              className='form-control radius-10'
                              type={attr.type === "number" ? "number" : "text"}
                              value={selected[0] || ""}
                              onChange={(e) => setScalarAttribute(attr.name, e.target.value)}
                              disabled={disabled}
                              placeholder={`Enter ${attr.name}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeTab === "variations" && formData.productType === "variable" && (
              <section className='bg-primary-25 radius-12 p-14'>
                <div className='d-flex flex-wrap align-items-center justify-content-between gap-8 mb-16'>
                  <div>
                    <h5 className='fw-bold mb-4'>Variation SKUs</h5>
                    <p className='mb-0 text-secondary-light text-sm'>Each row is a purchasable combination with its own price and stock.</p>
                  </div>
                  <button type='button' className='btn btn-outline-primary btn-sm radius-10' onClick={generateVariationsFromAttributes} disabled={disabled}>
                    Regenerate from attributes
                  </button>
                </div>
                {variations.length === 0 ? (
                  <p className='text-secondary-light mb-0'>No variations yet.</p>
                ) : (
                  <div className='table-responsive rounded-12 border'>
                    <table className='table table-sm mb-0 align-middle'>
                      <thead className='bg-neutral-100'>
                        <tr>
                          <th>Attributes</th>
                          <th>SKU</th>
                          <th>MRP</th>
                          <th>Discount</th>
                          <th>Final</th>
                          <th>Stock</th>
                          <th>Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variations.map((row, idx) => (
                          <tr key={attrsKey(row.attributes) || idx}>
                            <td className='text-xs text-secondary-light'>
                              {Object.entries(row.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                            </td>
                            <td><input className='form-control form-control-sm radius-8' value={row.sku} onChange={(e) => updateVariationRow(idx, { sku: e.target.value })} disabled={disabled} /></td>
                            <td><input className='form-control form-control-sm radius-8' value={row.sellPrice} onChange={(e) => updateVariationRow(idx, { sellPrice: e.target.value })} disabled={disabled} /></td>
                            <td><input className='form-control form-control-sm radius-8' value={row.discountAmount} onChange={(e) => updateVariationRow(idx, { discountAmount: e.target.value })} disabled={disabled} /></td>
                            <td><input className='form-control form-control-sm radius-8' value={row.finalPrice} onChange={(e) => updateVariationRow(idx, { finalPrice: e.target.value })} disabled={disabled} /></td>
                            <td><input type='number' min='0' className='form-control form-control-sm radius-8' value={row.quantity} onChange={(e) => updateVariationRow(idx, { quantity: e.target.value })} disabled={disabled} /></td>
                            <td><input type='checkbox' checked={row.isActive} onChange={(e) => updateVariationRow(idx, { isActive: e.target.checked })} disabled={disabled} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeTab === "seo" && (
              <section className="p4u-product-form-box">
                <div className="row g-12">
                  <Field col="col-md-12" label="SEO Title"><input className="form-control" name="seoTitle" value={formData.seoTitle} onChange={handleChange} disabled={disabled} placeholder="SEO title (max 60 chars)" /></Field>
                  <Field col="col-md-12" label="SEO Description"><textarea className="form-control" rows={4} name="seoDescription" value={formData.seoDescription} onChange={handleChange} disabled={disabled} placeholder="SEO description (max 160 chars)" /></Field>
                </div>
              </section>
            )}

            {inModal ? (
              <div className="p4u-product-modal__foot">
                {isEdit && onDelete && !isReadonly ? (
                  <button type="button" onClick={onDelete} className="p4u-products-btn-primary" style={{ marginRight: "auto", background: "#dc2626" }}>
                    <Icon icon="mdi:trash-can-outline" /> Delete
                  </button>
                ) : null}
                <button type="button" onClick={onCancel} className="p4u-products-btn-outline">Cancel</button>
                {isView && isReadonly && (
                  <button type="button" onClick={() => setIsReadonly(false)} className="p4u-products-btn-primary">Edit</button>
                )}
                {!isReadonly && (
                  <button type="submit" disabled={submitting || refsLoading} className="p4u-products-btn-primary">
                    {submitting ? "Saving..." : isEdit ? "Save" : "Create Product"}
                  </button>
                )}
              </div>
            ) : (
              <div className="d-flex justify-content-end gap-10 mt-20">
                <button type="button" onClick={onCancel} className="btn btn-light border radius-10 px-20">Close</button>
                {isView && isReadonly && (
                  <button type="button" onClick={() => setIsReadonly(false)} className="btn btn-primary radius-10 px-20">Edit</button>
                )}
                {!isReadonly && (
                  <button type="submit" disabled={submitting || refsLoading} className="btn btn-primary radius-10 px-20">
                    {submitting ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

const Tab = ({ active, label, onClick }) => (
  <button type="button" onClick={onClick} className={active ? "is-active" : ""}>
    {label}
  </button>
);

const Field = ({ col, label, children }) => (
  <div className={col}>
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export default ProductFormLayer;
