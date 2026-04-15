import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { deleteCategory, listCategories, listCatalogServices } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import CountAndChips from "../../components/admin/CountAndChips";
import FormModal from "../../components/admin/FormModal";
import CategoryFormLayer from "./CategoryFormLayer";

const CategoryListLayer = () => {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { mode: "add"|"edit"|"view", id? }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cRes, sRes] = await Promise.all([
        listCategories({ purpose: "all" }),
        listCatalogServices({ limit: 500, offset: 0 }),
      ]);
      setCategories(cRes.items || []);
      setServices(sRes.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const servicesByCategory = {};
  services.forEach((s) => {
    if (s.categoryId) {
      if (!servicesByCategory[s.categoryId]) servicesByCategory[s.categoryId] = [];
      servicesByCategory[s.categoryId].push(s);
    }
  });

  const filtered = search.trim()
    ? categories.filter((c) => {
        const q = search.toLowerCase();
        const catServices = servicesByCategory[c.id] || [];
        return (
          (c.name || "").toLowerCase().includes(q) ||
          catServices.some((s) => (s.name || "").toLowerCase().includes(q))
        );
      })
    : categories;

  const availBadge = (val) => val ? "bg-success-600 text-white" : "bg-danger-600 text-white";

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
        <div className="d-flex align-items-center flex-wrap gap-3">
          <button className="btn btn-primary text-sm btn-sm px-16 py-8 radius-8">Export with Excel</button>
          <button type="button" onClick={() => setModal({ mode: "add" })} className="btn btn-primary text-sm btn-sm px-12 py-8 radius-8 d-flex align-items-center gap-2">
            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" /> Add Category
          </button>
        </div>
        <input
          type="text"
          className="form-control radius-8"
          style={{ maxWidth: 320 }}
          placeholder="Search Categories or Sub Categories"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="card-body p-24">
        {error && <div className="alert alert-danger radius-12 mb-16" role="alert">{error}</div>}
        {loading ? (
          <p className="text-secondary-light mb-0">Loading categories...</p>
        ) : (
          <>
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table sm-table mb-0">
                <thead>
                  <tr>
                    <th scope="col">S.No</th>
                    <th scope="col">Name</th>
                    <th scope="col">Image</th>
                    <th scope="col">Sub Categories (Services)</th>
                    <th scope="col" className="text-center">Availability</th>
                    <th scope="col" className="text-center">Emergency</th>
                    <th scope="col" className="text-center">Trending</th>
                    <th scope="col" className="text-center">Verification Status</th>
                    <th scope="col" className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((cat, index) => {
                      const catServices = servicesByCategory[cat.id] || [];
                      return (
                        <tr key={cat.id}>
                          <td>{index + 1}</td>
                          <td><span className="text-md fw-normal text-secondary-light">{cat.name || "—"}</span></td>
                          <td>
                            {cat.thumbnailUrl ? (
                              <img src={cat.thumbnailUrl} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} onError={(e) => { e.target.style.display = "none"; }} />
                            ) : <span className="text-secondary-light">—</span>}
                          </td>
                          <td>
                            <CountAndChips
                              items={catServices}
                              getLabel={(s) => s.name}
                              getKey={(s) => s.id}
                              countSuffix="services"
                            />
                          </td>
                          <td className="text-center">
                            <span className={`px-12 py-4 radius-4 fw-medium text-sm ${availBadge(cat.availability)}`}>
                              {cat.availability ? "Active" : "Deactive"}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="text-secondary-light text-sm">{cat.emergency ? "Active" : "Deactive"}</span>
                          </td>
                          <td className="text-center">
                            <span className={`px-12 py-4 radius-4 fw-medium text-sm ${cat.trending ? "bg-success-600 text-white" : "bg-danger-600 text-white"}`}>
                              {cat.trending ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="px-12 py-4 radius-4 fw-medium text-sm bg-success-600 text-white">VERIFIED</span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center gap-10 justify-content-center">
                              <button type="button" onClick={() => setModal({ mode: "view", id: cat.id })} className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="View">
                                <Icon icon="majesticons:eye-line" className="icon text-xl" />
                              </button>
                              <button type="button" onClick={() => setModal({ mode: "edit", id: cat.id })} className="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="Edit">
                                <Icon icon="lucide:edit" className="menu-icon" />
                              </button>
                              <button type="button" onClick={() => handleDelete(cat.id)} className="remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" title="Delete">
                                <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="9" className="text-center py-4">No categories found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24">
              <span>{filtered.length} categor{filtered.length === 1 ? "y" : "ies"}</span>
            </div>
          </>
        )}
      </div>

      {modal && (
        <FormModal onClose={() => setModal(null)} size="lg">
          <CategoryFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            categoryId={modal.id}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default CategoryListLayer;
