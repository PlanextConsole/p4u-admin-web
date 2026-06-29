import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  deleteProductCategory,
  deleteProductSubcategory,
  deleteServiceCategory,
  deleteServiceSubcategory,
  listProductCategories,
  listProductSubcategories,
  listServiceCategories,
  listServiceSubcategories,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import CountAndChips from "../../components/admin/CountAndChips";
import FormModal from "../../components/admin/FormModal";
import CategoryFormLayer from "./CategoryFormLayer";

function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

function yesNoPill(val, invert = false) {
  const yes = Boolean(val);
  const showYes = invert ? !yes : yes;
  return showYes
    ? { label: "Yes", cls: "p4u-cat-pill is-yes" }
    : { label: "No", cls: "p4u-cat-pill is-no" };
}

/**
 * @param {{ variant?: 'service-roots' | 'service-subs' | 'product-roots' | 'product-subs' }} props
 */
const CategoryListLayer = ({ variant = "service-roots" }) => {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [productRootsForParent, setProductRootsForParent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState("all");
  const [trendFilter, setTrendFilter] = useState("all");
  const [homeFilter, setHomeFilter] = useState("all");
  const [parentFilter, setParentFilter] = useState("all");
  const [modal, setModal] = useState(null);

  const isSubTable = variant === "product-subs" || variant === "service-subs";
  const isProductRoots = variant === "product-roots";
  const isServiceRoots = variant === "service-roots";
  const isProduct = variant === "product-roots" || variant === "product-subs";
  const showThumbnailImage = isSubTable || isProductRoots || variant === "service-subs";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (variant === "service-roots") {
        const [cRes, sRes] = await Promise.all([
          listServiceCategories({ purpose: "all" }),
          listServiceSubcategories({ purpose: "all" }),
        ]);
        const roots = cRes.items || [];
        const subs = sRes.items || [];
        setCategories(roots.map((c) => ({ ...c, parentId: null })));
        setServices(subs);
        setProductRootsForParent(roots);
      } else if (variant === "service-subs") {
        const [rRes, sRes] = await Promise.all([
          listServiceCategories({ purpose: "all" }),
          listServiceSubcategories({ purpose: "all" }),
        ]);
        const roots = rRes.items || [];
        const subs = sRes.items || [];
        setCategories(subs.map((s) => ({ ...s, parentId: s.serviceCategoryId })));
        setServices([]);
        setProductRootsForParent(roots);
      } else if (variant === "product-roots") {
        const [rRes, sRes] = await Promise.all([
          listProductCategories({ purpose: "all" }),
          listProductSubcategories({ purpose: "all" }),
        ]);
        const roots = rRes.items || [];
        const subs = sRes.items || [];
        setCategories(roots.map((c) => ({ ...c, parentId: null })));
        setServices(subs);
        setProductRootsForParent(roots);
      } else {
        const [rRes, sRes] = await Promise.all([
          listProductCategories({ purpose: "all" }),
          listProductSubcategories({ purpose: "all" }),
        ]);
        const roots = rRes.items || [];
        const subs = sRes.items || [];
        setCategories(subs.map((s) => ({ ...s, parentId: s.productCategoryId })));
        setServices([]);
        setProductRootsForParent(roots);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [variant]);

  useEffect(() => { load(); }, [load]);

  const subsByParent = useMemo(() => {
    const m = {};
    services.forEach((sub) => {
      const pid = sub.productCategoryId || sub.serviceCategoryId;
      if (!pid) return;
      if (!m[pid]) m[pid] = [];
      m[pid].push(sub);
    });
    return m;
  }, [services]);

  const rootCategories = useMemo(
    () => productRootsForParent.map((c) => ({ id: c.id, name: c.name })),
    [productRootsForParent],
  );

  const parentById = useMemo(() => {
    const m = {};
    productRootsForParent.forEach((c) => { m[c.id] = c; });
    return m;
  }, [productRootsForParent]);

  const pool = useMemo(() => {
    if (isSubTable) return categories.filter((c) => Boolean(c.parentId));
    return categories;
  }, [categories, isSubTable]);

  const filtered = useMemo(() => {
    let rows = pool;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => {
        const linked = isServiceRoots || isProductRoots ? (subsByParent[c.id] || []) : [];
        const parentName = c.parentId ? (parentById[c.parentId]?.name || "") : "";
        return (
          (c.name || "").toLowerCase().includes(q) ||
          parentName.toLowerCase().includes(q) ||
          linked.some((x) => (x.name || "").toLowerCase().includes(q))
        );
      });
    }
    if (availFilter === "active") rows = rows.filter((c) => c.availability);
    if (availFilter === "deactive") rows = rows.filter((c) => !c.availability);
    if (trendFilter === "yes") rows = rows.filter((c) => c.trending);
    if (trendFilter === "no") rows = rows.filter((c) => !c.trending);
    if (homeFilter === "yes") rows = rows.filter((c) => c.isActive !== false);
    if (homeFilter === "no") rows = rows.filter((c) => c.isActive === false);
    if (parentFilter !== "all") rows = rows.filter((c) => c.parentId === parentFilter);
    return rows;
  }, [pool, search, subsByParent, parentById, isServiceRoots, isProductRoots, availFilter, trendFilter, homeFilter, parentFilter]);

  const stats = useMemo(() => {
    const rootCount = isSubTable ? productRootsForParent.length : pool.length;
    const subCount = isSubTable ? pool.length : services.length;
    const activeCount = pool.filter((c) => c.availability).length;
    const trendingCount = pool.filter((c) => c.trending).length;
    return { rootCount, subCount, activeCount, trendingCount };
  }, [pool, services, productRootsForParent, isSubTable]);

  const typeLabel = isProduct ? "PRODUCT" : "SERVICE";

  const heroTitle = isSubTable ? "Subcategories" : "Categories";

  const heroSubtitle = isSubTable
    ? `${stats.subCount} subcategories, ${stats.rootCount} categories`
    : `${stats.rootCount} categories, ${stats.subCount} subcategories`;

  const subcategoryLink = isProductRoots ? "/subcategories" : "/service-subcategories";
  const categoryLink = isProduct ? "/product-categories" : "/service-categories";

  const handleDelete = async (id) => {
    const msg =
      variant === "product-subs"
        ? "Delete this product subcategory?"
        : variant === "service-subs"
          ? "Delete this service subcategory?"
          : variant === "product-roots"
            ? "Delete this product category?"
            : "Delete this service category?";
    if (!window.confirm(msg)) return;
    try {
      if (variant === "service-roots") await deleteServiceCategory(id);
      else if (variant === "service-subs") await deleteServiceSubcategory(id);
      else if (variant === "product-roots") await deleteProductCategory(id);
      else await deleteProductSubcategory(id);
      if (modal?.id === id) setModal(null);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const addLabel =
    variant === "product-subs"
      ? "Add Subcategory"
      : variant === "service-subs"
        ? "Add Subcategory"
        : variant === "product-roots"
          ? "Add Category"
          : "Add Category";

  const chipsTitle = isServiceRoots || isProductRoots ? "Subcategories" : null;

  const chipItems = (cat) => {
    if (isServiceRoots || isProductRoots) return subsByParent[cat.id] || [];
    return [];
  };

  const exportCsv = () => {
    const headers = [
      "S.No", "Order", "On Home", "Name", "Type",
      ...(isSubTable ? ["Parent"] : []),
      "Availability", "Emergency", "Trending", "Verification",
    ];
    const lines = filtered.map((cat, i) => {
      const parentName = cat.parentId ? (parentById[cat.parentId]?.name || "") : "";
      return [
        i + 1,
        cat.sortOrder ?? 0,
        cat.isActive !== false ? "Yes" : "No",
        cat.name || "",
        typeLabel,
        ...(isSubTable ? [parentName] : []),
        cat.availability ? "Active" : "Deactive",
        cat.emergency ? "Active" : "Deactive",
        cat.trending ? "Yes" : "No",
        "VERIFIED",
      ];
    });
    const blob = new Blob([toCsv([headers, ...lines])], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `categories-${variant}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableColSpan = isSubTable ? 13 : 13;

  const statCards = isSubTable
    ? [
        { key: "total", label: "Total Subcategories", value: stats.subCount, icon: "mdi:package-variant-closed", cls: "is-subs" },
        { key: "active", label: "Active", value: stats.activeCount, icon: "mdi:check-circle-outline", cls: "is-active" },
        { key: "parents", label: "Parent Categories", value: stats.rootCount, icon: "mdi:layers-outline", cls: "is-total" },
        { key: "trending", label: "Trending", value: stats.trendingCount, icon: "mdi:trending-up", cls: "is-trending" },
      ]
    : [
        { key: "total", label: "Total Categories", value: stats.rootCount, icon: "mdi:layers-outline", cls: "is-total" },
        { key: "active", label: "Active", value: stats.activeCount, icon: "mdi:check-circle-outline", cls: "is-active" },
        { key: "subs", label: "Total Subcategories", value: stats.subCount, icon: "mdi:package-variant-closed", cls: "is-subs" },
        { key: "trending", label: "Trending", value: stats.trendingCount, icon: "mdi:trending-up", cls: "is-trending" },
      ];

  return (
    <div className="p4u-categories-page">
      <div className="p4u-categories-hero">
        <div>
          <h3>{heroTitle}</h3>
          <p>{heroSubtitle}</p>
        </div>
      </div>

      <div className="p4u-categories-top-filters">
        <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)} aria-label="Filter availability">
          <option value="all">All availability</option>
          <option value="active">Active</option>
          <option value="deactive">Deactive</option>
        </select>
        <select value={trendFilter} onChange={(e) => setTrendFilter(e.target.value)} aria-label="Filter trending">
          <option value="all">All trending</option>
          <option value="yes">Trending</option>
          <option value="no">Not trending</option>
        </select>
        <select value={homeFilter} onChange={(e) => setHomeFilter(e.target.value)} aria-label="Filter on home">
          <option value="all">All on home</option>
          <option value="yes">On home</option>
          <option value="no">Not on home</option>
        </select>
        <select defaultValue="all" aria-label="Filter type" disabled>
          <option value="all">All Types</option>
          <option value={typeLabel}>{typeLabel}</option>
        </select>
        {isSubTable && (
          <select value={parentFilter} onChange={(e) => setParentFilter(e.target.value)} aria-label="Filter parent category">
            <option value="all">All parent categories</option>
            {rootCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name || c.id}</option>
            ))}
          </select>
        )}
        {isSubTable ? (
          <Link to={categoryLink} className="p4u-categories-btn-outline text-decoration-none">
            <Icon icon="mdi:layers-outline" /> View Categories
          </Link>
        ) : (
          <Link to={subcategoryLink} className="p4u-categories-btn-outline text-decoration-none">
            <Icon icon="ic:baseline-plus" /> Add Subcategory
          </Link>
        )}
      </div>

      <div className="p4u-categories-stats">
        {statCards.map((card) => (
          <div key={card.key} className={`p4u-categories-stat ${card.cls}`}>
            <span className="p4u-categories-stat__icon"><Icon icon={card.icon} /></span>
            <div>
              <p className="p4u-categories-stat__label">{card.label}</p>
              <p className="p4u-categories-stat__value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p4u-categories-toolbar">
        <label className="p4u-categories-search">
          <Icon icon="mdi:magnify" className="text-secondary-light" />
          <input
            type="text"
            placeholder={isSubTable ? "Search subcategories or parent..." : "Search categories or subcategories..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="p4u-categories-toolbar__actions">
          <button type="button" onClick={() => setModal({ mode: "add" })} className="p4u-categories-btn-primary">
            <Icon icon="ic:baseline-plus" /> {addLabel}
          </button>
          <button type="button" onClick={exportCsv} className="p4u-categories-btn-outline">
            <Icon icon="mdi:download-outline" /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      {loading ? (
        <p className="text-secondary-light mb-0">{isSubTable ? "Loading subcategories..." : "Loading categories..."}</p>
      ) : (
        <div className="p4u-categories-table-wrap">
          <table className="p4u-categories-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 36 }} />
                <th scope="col">S.No</th>
                <th scope="col">Order</th>
                <th scope="col">On Home</th>
                <th scope="col">Name</th>
                {isSubTable && <th scope="col">Parent Category</th>}
                <th scope="col">Type</th>
                <th scope="col">{showThumbnailImage ? "Image" : "Icon"}</th>
                {chipsTitle && <th scope="col">Sub Categories (Services)</th>}
                <th scope="col">Availability</th>
                <th scope="col">Emergency</th>
                <th scope="col">Trending</th>
                <th scope="col">Verification Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((cat, index) => {
                  const chips = chipItems(cat);
                  const homePill = yesNoPill(cat.isActive !== false);
                  const trendPill = yesNoPill(cat.trending);
                  const imgUrl = showThumbnailImage
                    ? cat.thumbnailUrl
                    : (cat.iconUrl || cat.thumbnailUrl);
                  return (
                    <tr key={cat.id}>
                      <td>
                        <input type="checkbox" className="form-check-input" aria-label={`Select ${cat.name}`} readOnly />
                      </td>
                      <td>{index + 1}</td>
                      <td><span className="p4u-cat-pill is-order">{cat.sortOrder ?? 0}</span></td>
                      <td><span className={homePill.cls}>{homePill.label}</span></td>
                      <td><span className="cat-name">{cat.name || "—"}</span></td>
                      {isSubTable && (
                        <td>{cat.parentId ? (parentById[cat.parentId]?.name || "—") : "—"}</td>
                      )}
                      <td>
                        <span className={`p4u-cat-pill ${isProduct ? "is-product" : "is-service"}`}>{typeLabel}</span>
                      </td>
                      <td>
                        {imgUrl ? (
                          <img
                            src={resolveMediaUrl(imgUrl)}
                            alt=""
                            className="p4u-categories-thumb"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span className="text-secondary-light">—</span>
                        )}
                      </td>
                      {chipsTitle && (
                        <td>
                          <CountAndChips
                            items={chips}
                            getLabel={(s) => s.name}
                            getKey={(s) => s.id}
                            countSuffix="subcategories"
                          />
                        </td>
                      )}
                      <td>
                        <span className={cat.availability ? "p4u-cat-pill is-active" : "p4u-cat-pill is-deactive"}>
                          {cat.availability ? "Active" : "Deactive"}
                        </span>
                      </td>
                      <td>
                        <span className={cat.emergency ? "p4u-cat-pill is-active" : "p4u-cat-pill is-deactive"}>
                          {cat.emergency ? "Active" : "Deactive"}
                        </span>
                      </td>
                      <td><span className={trendPill.cls}>{trendPill.label}</span></td>
                      <td>
                        <span className="p4u-cat-pill is-verified">
                          <Icon icon="mdi:shield-check-outline" className="me-1" /> VERIFIED
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="p4u-categories-action-btn"
                            onClick={() => setModal({ mode: "view", id: cat.id })}
                            aria-label="View"
                            title="View"
                          >
                            <Icon icon="majesticons:eye-line" />
                          </button>
                          <button
                            type="button"
                            className="p4u-categories-action-btn"
                            onClick={() => setModal({ mode: "edit", id: cat.id })}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil-outline" />
                          </button>
                          <button
                            type="button"
                            className="p4u-categories-action-btn is-danger"
                            onClick={() => handleDelete(cat.id)}
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Icon icon="mdi:trash-can-outline" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={tableColSpan} className="text-center py-4">{isSubTable ? "No subcategories found." : "No categories found."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormModal onClose={() => setModal(null)} size="xl">
          <CategoryFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            categoryId={modal.id}
            variant={variant}
            scope={isSubTable ? "subcategory" : "root"}
            rootCategories={rootCategories}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
            onDelete={modal.mode === "edit" && modal.id ? () => handleDelete(modal.id) : undefined}
          />
        </FormModal>
      )}
    </div>
  );
};

export default CategoryListLayer;
