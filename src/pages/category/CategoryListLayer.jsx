import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { deleteCategory, listCategories } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";

const CategoryListLayer = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCategories({ purpose: "all" });
      setCategories(res.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
        <span className='text-md fw-medium text-secondary-light mb-0'>Categories</span>
        <Link to='/add-category' className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add Category
        </Link>
      </div>
      <div className='card-body p-24'>
        {error && (
          <div className='alert alert-danger radius-12 mb-16' role='alert'>
            {error}
          </div>
        )}
        {loading ? (
          <p className='text-secondary-light mb-0'>Loading categories...</p>
        ) : (
          <>
            <div className='table-responsive scroll-sm'>
              <table className='table bordered-table sm-table mb-0'>
                <thead>
                  <tr>
                    <th scope='col'>S.No</th>
                    <th scope='col'>Name</th>
                    <th scope='col'>Slug</th>
                    <th scope='col'>Thumbnail</th>
                    <th scope='col' className='text-center'>Active</th>
                    <th scope='col'>Sort</th>
                    <th scope='col'>Updated</th>
                    <th scope='col' className='text-center'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map((cat, index) => (
                      <tr key={cat.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className='text-md mb-0 fw-normal text-secondary-light'>{cat.name || "—"}</span>
                        </td>
                        <td>{cat.slug || "—"}</td>
                        <td>
                          {cat.thumbnailUrl ? (
                            <img
                              src={cat.thumbnailUrl}
                              alt=''
                              className='w-40-px h-40-px rounded-circle flex-shrink-0 overflow-hidden object-fit-cover'
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/40";
                              }}
                            />
                          ) : (
                            <span className='text-secondary-light text-sm'>—</span>
                          )}
                        </td>
                        <td className='text-center'>
                          <span
                            className={`px-12 py-4 radius-4 fw-medium text-sm ${
                              cat.isActive
                                ? "bg-success-focus text-success-600 border border-success-main"
                                : "bg-neutral-200 text-neutral-600 border border-neutral-400"
                            }`}
                          >
                            {cat.isActive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>{cat.sortOrder ?? "—"}</td>
                        <td>{formatDateTime(cat.updatedAt)}</td>
                        <td className='text-center'>
                          <div className='d-flex align-items-center gap-10 justify-content-center'>
                            <Link
                              to={`/view-category/${cat.id}`}
                              className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle'
                              title='View'
                            >
                              <Icon icon='majesticons:eye-line' className='icon text-xl' />
                            </Link>
                            <Link
                              to={`/edit-category/${cat.id}`}
                              className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle'
                              title='Edit'
                            >
                              <Icon icon='lucide:edit' className='menu-icon' />
                            </Link>
                            <button
                              type='button'
                              onClick={() => handleDelete(cat.id)}
                              className='remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0'
                              title='Delete'
                            >
                              <Icon icon='fluent:delete-24-regular' className='menu-icon' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan='8' className='text-center py-4'>
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
              <span>
                {categories.length} categor{categories.length === 1 ? "y" : "ies"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryListLayer;