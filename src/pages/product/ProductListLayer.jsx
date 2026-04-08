import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { deleteProduct, listProducts, listVendors, listCategories, listCatalogServices, listTaxConfigurations } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import CountAndChips from "../../components/admin/CountAndChips";

const ProductListLayer = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [vendorMap, setVendorMap] = useState({});
  const [categoryMap, setCategoryMap] = useState({});
  const [serviceMap, setServiceMap] = useState({});
  const [taxMap, setTaxMap] = useState({});

  useEffect(() => {
    Promise.all([
      listVendors({ limit: 200, offset: 0 }),
      listCategories({ purpose: "all" }),
      listCatalogServices({ limit: 500, offset: 0 }),
      listTaxConfigurations({ purpose: "all" }),
    ]).then(([vRes, cRes, sRes, tRes]) => {
      const vm = {}; (vRes.items || []).forEach((v) => { vm[v.id] = v.businessName || v.ownerName || "Vendor"; });
      const cm = {}; (cRes.items || []).forEach((c) => { cm[c.id] = c.name; });
      const sm = {}; (sRes.items || []).forEach((s) => { sm[s.id] = s.name; });
      const tm = {}; (tRes.items || []).forEach((t) => { tm[t.id] = { title: t.title || t.code, percentage: t.percentage }; });
      setVendorMap(vm);
      setCategoryMap(cm);
      setServiceMap(sm);
      setTaxMap(tm);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listProducts({ limit, offset });
      setProducts(res.items || []);
      setTotal(typeof res.total === "number" ? res.total : 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const filtered = search.trim()
    ? products.filter((p) => {
        const q = search.toLowerCase();
        return (
          (p.name || "").toLowerCase().includes(q) ||
          (categoryMap[p.categoryId] || "").toLowerCase().includes(q) ||
          (serviceMap[p.serviceId] || "").toLowerCase().includes(q) ||
          (vendorMap[p.vendorId] || "").toLowerCase().includes(q)
        );
      })
    : products;

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = offset + products.length;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const calcTax = (price, taxId) => {
    const tax = taxMap[taxId];
    if (!tax || !price) return { cgst: 0, sgst: 0 };
    const p = Number(price) || 0;
    const pct = Number(tax.percentage) || 0;
    const half = Math.round((p * pct / 100) / 2);
    return { cgst: half, sgst: half, title: tax.title };
  };

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
        <button className="btn btn-primary text-sm btn-sm px-16 py-8 radius-8">Export with Excel</button>
        <input
          type="text"
          className="form-control radius-8"
          style={{ maxWidth: 340 }}
          placeholder="Search by product name, category or service"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="card-body p-24">
        {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading products...</p>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th scope="col">S.No</th>
                    <th scope="col">Name</th>
                    <th scope="col">Vendor</th>
                    <th scope="col">Category</th>
                    <th scope="col">Services</th>
                    <th scope="col">Cost</th>
                    <th scope="col">Services Type</th>
                    <th scope="col">CGST</th>
                    <th scope="col">SGST</th>
                    <th scope="col" className="text-center">Available</th>
                    <th scope="col" className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((product, index) => {
                      const tax = calcTax(product.sellPrice || product.price, product.taxConfigurationId);
                      return (
                        <tr key={product.id}>
                          <td>{offset + index + 1}</td>
                          <td><span className="text-md fw-normal text-secondary-light">{(product.name || "—").substring(0, 20)}{(product.name || "").length > 20 ? "..." : ""}</span></td>
                          <td><span className="text-md fw-normal text-secondary-light">{(vendorMap[product.vendorId] || "—").substring(0, 18)}{(vendorMap[product.vendorId] || "").length > 18 ? "..." : ""}</span></td>
                          <td>
                            <CountAndChips
                              strings={categoryMap[product.categoryId] ? [categoryMap[product.categoryId]] : []}
                              countSuffix="categories"
                            />
                          </td>
                          <td>
                            <CountAndChips
                              strings={serviceMap[product.serviceId] ? [serviceMap[product.serviceId]] : []}
                              countSuffix="services"
                            />
                          </td>
                          <td>&#8377; {product.sellPrice || product.price || 0}</td>
                          <td>{tax.title || "—"}</td>
                          <td>&#8377; {tax.cgst}</td>
                          <td>&#8377; {tax.sgst}</td>
                          <td className="text-center">
                            <span className={`px-12 py-4 radius-4 fw-medium text-sm ${(product.availability || product.isActive) ? "bg-success-600 text-white" : "bg-danger-600 text-white"}`}>
                              {(product.availability || product.isActive) ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center gap-10 justify-content-center">
                              <Link to={`/view-product/${product.id}`} className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" title="View">
                                <Icon icon="majesticons:eye-line" className="icon text-xl" />
                              </Link>
                              <Link to={`/edit-product/${product.id}`} className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" title="Edit">
                                <Icon icon="lucide:edit" className="menu-icon" />
                              </Link>
                              <button type="button" onClick={() => handleDelete(product.id)} className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="Delete">
                                <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="11" className="text-center py-4">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
              <span>Showing {pageFrom} to {pageTo} of {total} entries</span>
              <div className="d-flex gap-2 align-items-center">
                <button type="button" className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md" disabled={!canPrev} onClick={() => setOffset(Math.max(0, offset - limit))}>
                  <Icon icon="ep:d-arrow-left" />
                </button>
                <span className="page-link fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px text-md bg-primary-600 text-white mb-0">{Math.floor(offset / limit) + 1}</span>
                <button type="button" className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md" disabled={!canNext} onClick={() => setOffset(offset + limit)}>
                  <Icon icon="ep:d-arrow-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductListLayer;
