import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { deleteCatalogService, listCatalogServices } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";

function truncateDescription(text, maxLen = 72) {
  if (!text) return "—";
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}...` : text;
}

const ServiceListLayer = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listCatalogServices({ purpose: "all" });
      setServices(res.items || []);
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
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteCatalogService(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
        <span className='text-md fw-medium text-secondary-light mb-0'>Services</span>
        <Link to='/add-service' className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
          Add Service
        </Link>
      </div>
      <div className='card-body p-24'>
        {error && (
          <div className='alert alert-danger radius-12 mb-16' role='alert'>
            {error}
          </div>
        )}
        {loading ? (
          <p className='text-secondary-light mb-0'>Loading services...</p>
        ) : (
          <>
            <div className='table-responsive scroll-sm'>
              <table className='table bordered-table sm-table mb-0'>
                <thead>
                  <tr>
                    <th scope='col'>S.No</th>
                    <th scope='col'>Name</th>
                    <th scope='col'>Description</th>
                    <th scope='col' className='text-center'>Active</th>
                    <th scope='col'>Sort</th>
                    <th scope='col'>Updated</th>
                    <th scope='col' className='text-center'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length > 0 ? (
                    services.map((srv, index) => (
                      <tr key={srv.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className='text-md mb-0 fw-normal text-secondary-light'>{srv.name || "—"}</span>
                        </td>
                        <td>
                          <span className='text-sm text-secondary-light' title={srv.description || ""}>
                            {truncateDescription(srv.description)}
                          </span>
                        </td>
                        <td className='text-center'>
                          <span
                            className={`px-12 py-4 radius-4 fw-medium text-sm ${
                              srv.isActive
                                ? "bg-success-focus text-success-600 border border-success-main"
                                : "bg-neutral-200 text-neutral-600 border border-neutral-400"
                            }`}
                          >
                            {srv.isActive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>{srv.sortOrder ?? "—"}</td>
                        <td>{formatDateTime(srv.updatedAt)}</td>
                        <td className='text-center'>
                          <div className='d-flex align-items-center gap-10 justify-content-center'>
                            <Link
                              to={`/view-service/${srv.id}`}
                              className='bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle'
                              title='View'
                            >
                              <Icon icon='majesticons:eye-line' className='icon text-xl' />
                            </Link>
                            <Link
                              to={`/edit-service/${srv.id}`}
                              className='bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle'
                              title='Edit'
                            >
                              <Icon icon='lucide:edit' className='menu-icon' />
                            </Link>
                            <button
                              type='button'
                              onClick={() => handleDelete(srv.id)}
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
                      <td colSpan='7' className='text-center py-4'>
                        No services found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mt-24'>
              <span>
                {services.length} service{services.length === 1 ? "" : "s"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceListLayer;
