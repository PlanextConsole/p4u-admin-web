import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { deleteProduct, listProducts, listVendors, listCategoriesForProducts, updateProduct } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveAdminProductUnitPrice } from "../../lib/resolveProductPrice";
import FormModal from "../../components/admin/FormModal";
import ProductFormLayer from "./ProductFormLayer";

function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

function isPendingModeration(p) {
  return String(p.moderationStatus || "").toLowerCase() === "pending";
}

function parseMeta(p) {
  const raw = p.metadata || p.metaJson;
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function formatProductDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  const day = dt.toLocaleString("en-IN", { day: "2-digit" });
  const mon = dt.toLocaleString("en-IN", { month: "short" });
  const yr = String(dt.getFullYear()).slice(-2);
  const time = dt.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} ${mon} ${yr}, ${time}`;
}

function productTypeLabel(p) {
  const meta = parseMeta(p);
  const t = String(meta.productType || "simple");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const ProductListLayer = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vendorMap, setVendorMap] = useState({});
  const [categoryMap, setCategoryMap] = useState({});
  const [modal, setModal] = useState(null);

  useEffect(() => {
    Promise.all([
      listVendors({ limit: 200, offset: 0 }),
      listCategoriesForProducts({ purpose: "all" }),
    ]).then(([vRes, cRes]) => {
      const vm = {}; (vRes.items || []).forEach((v) => { vm[v.id] = v.businessName || v.ownerName || "Vendor"; });
      const cm = {}; (cRes.items || []).forEach((c) => { cm[c.id] = c.name; });
      setVendorMap(vm);
      setCategoryMap(cm);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listProducts({ limit: 500, offset: 0 });
      setProducts(res.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApproveProduct = async (id) => {
    try {
      await updateProduct(id, {
        moderationStatus: "approved",
        isActive: true,
        availability: true,
      });
      toast.success("Product approved and published.");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted.");
      if (modal?.id === id) setModal(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const pendingMod = isPendingModeration(p);
      if (tab === "pending" && !pendingMod) return false;
      if (tab === "all" && pendingMod) return false;
      if (fromDate) {
        const d = new Date(p.createdAt);
        if (Number.isNaN(d.getTime()) || d < new Date(fromDate)) return false;
      }
      if (toDate) {
        const d = new Date(p.createdAt);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (Number.isNaN(d.getTime()) || d > end) return false;
      }
      if (!q) return true;
      const ref = (p.productRef || "").toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        ref.includes(q) ||
        (categoryMap[p.categoryId] || "").toLowerCase().includes(q) ||
        (vendorMap[p.vendorId] || "").toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryMap, vendorMap, tab, fromDate, toDate]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeCount = products.filter((p) => !isPendingModeration(p) && (p.availability || p.isActive)).length;
    const catalogForAvg = products.filter((p) => !isPendingModeration(p));
    const avgPrice = catalogForAvg.length
      ? Math.round(
          catalogForAvg.reduce((sum, p) => sum + resolveAdminProductUnitPrice(p), 0) / catalogForAvg.length,
        )
      : 0;
    return { totalProducts, activeCount, avgPrice };
  }, [products]);

  const exportCsv = () => {
    const metaVolume = (p) => {
      const m = parseMeta(p);
      return m.specVolume ?? p.specVolume ?? "";
    };
    const csvRows = [
      ["ID", "Product", "Vendor", "Price", "Discount", "Volume", "Status", "Created", "Updated"],
      ...filtered.map((p) => [
        p.productRef || p.id || "",
        p.name || "",
        vendorMap[p.vendorId] || "",
        resolveAdminProductUnitPrice(p),
        p.discountAmount || "",
        metaVolume(p),
        isPendingModeration(p) ? "pending_approval" : (p.availability || p.isActive) ? "active" : "inactive",
        p.createdAt || "",
        p.updatedAt || "",
      ]),
    ];
    const csv = toCsv(csvRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusPill = (pendingMod, active) => {
    if (pendingMod) return { label: "Pending approval", cls: "p4u-product-pill is-pending" };
    if (active) return { label: "Active", cls: "p4u-product-pill is-active" };
    return { label: "Inactive", cls: "p4u-product-pill is-inactive" };
  };

  return (
    <div className="p4u-products-page">
      <div className="p4u-products-hero">
        <h3>Products</h3>
        <p>{stats.totalProducts} products across all vendors</p>
      </div>

      <div className="p4u-products-tabs">
        <button type="button" className={tab === "pending" ? "is-active" : ""} onClick={() => setTab("pending")}>
          Pending Approval
        </button>
        <button type="button" className={tab === "all" ? "is-active" : ""} onClick={() => setTab("all")}>
          All Products
        </button>
      </div>

      <div className="p4u-products-stats">
        <div className="p4u-products-stat is-total">
          <span className="p4u-products-stat__icon"><Icon icon="mdi:package-variant-closed" /></span>
          <div>
            <p className="p4u-products-stat__label">Total Products</p>
            <p className="p4u-products-stat__value">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="p4u-products-stat is-active">
          <span className="p4u-products-stat__icon"><Icon icon="mdi:trending-up" /></span>
          <div>
            <p className="p4u-products-stat__label">Active</p>
            <p className="p4u-products-stat__value">{stats.activeCount}</p>
          </div>
        </div>
        <div className="p4u-products-stat is-price">
          <span className="p4u-products-stat__icon"><Icon icon="mdi:currency-inr" /></span>
          <div>
            <p className="p4u-products-stat__label">Avg Price</p>
            <p className="p4u-products-stat__value">₹{stats.avgPrice}</p>
          </div>
        </div>
      </div>

      <div className="p4u-products-toolbar">
        <label className="p4u-products-search">
          <Icon icon="mdi:magnify" className="text-secondary-light" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="p4u-products-date">
          <Icon icon="mdi:calendar-outline" />
          <span>From Date</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label className="p4u-products-date">
          <Icon icon="mdi:calendar-outline" />
          <span>To Date</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <div className="p4u-products-toolbar__actions">
          <button type="button" onClick={() => setModal({ mode: "add" })} className="p4u-products-btn-primary">
            <Icon icon="ic:baseline-plus" /> Add Product
          </button>
          <button type="button" onClick={exportCsv} className="p4u-products-btn-outline">
            <Icon icon="mdi:download-outline" /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}

      {loading ? (
        <p className="text-secondary-light mb-0">Loading products...</p>
      ) : (
        <div className="p4u-products-table-wrap">
          <table className="p4u-products-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 36 }} />
                <th scope="col">ID</th>
                <th scope="col">Product</th>
                <th scope="col">Vendor</th>
                <th scope="col">Price</th>
                <th scope="col">Discount</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
                <th scope="col">Updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((product) => {
                  const price = resolveAdminProductUnitPrice(product);
                  const discount = Number(product.discountAmount || 0) || 0;
                  const pendingMod = isPendingModeration(product);
                  const active = !pendingMod && Boolean(product.availability || product.isActive);
                  const ref = product.productRef || `PRD-${String(product.id || "").slice(-6)}`;
                  const pill = statusPill(pendingMod, active);
                  const categoryName = categoryMap[product.categoryId] || "—";
                  const typeLabel = productTypeLabel(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <input type="checkbox" className="form-check-input" aria-label={`Select ${product.name}`} readOnly />
                      </td>
                      <td>{ref}</td>
                      <td>
                        <div className="product-name">{product.name || "—"}</div>
                        <div className="product-meta">{categoryName} • {typeLabel}</div>
                      </td>
                      <td>{vendorMap[product.vendorId] || "—"}</td>
                      <td className="fw-bold">₹{price}</td>
                      <td>{discount > 0 ? `₹${discount}` : "—"}</td>
                      <td><span className={pill.cls}>{pill.label}</span></td>
                      <td>{formatProductDateTime(product.createdAt)}</td>
                      <td>{formatProductDateTime(product.updatedAt)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {pendingMod ? (
                            <button
                              type="button"
                              onClick={() => void handleApproveProduct(product.id)}
                              className="p4u-products-btn-approve"
                              title="Approve and publish to catalog"
                            >
                              Approve
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="p4u-products-action-btn"
                            onClick={() => setModal({ mode: "view", id: product.id })}
                            aria-label="View"
                            title="View"
                          >
                            <Icon icon="majesticons:eye-line" />
                          </button>
                          <button
                            type="button"
                            className="p4u-products-action-btn"
                            onClick={() => setModal({ mode: "edit", id: product.id })}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Icon icon="mdi:pencil-outline" />
                          </button>
                          <button
                            type="button"
                            className="p4u-products-action-btn is-danger"
                            onClick={() => handleDelete(product.id)}
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
                <tr><td colSpan={10} className="text-center py-4">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormModal onClose={() => setModal(null)} size="xl">
          <ProductFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            productId={modal.id}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
            onDelete={modal.mode === "edit" && modal.id ? () => handleDelete(modal.id) : undefined}
          />
        </FormModal>
      )}
    </div>
  );
};

export default ProductListLayer;
