import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { deleteAvailableArea, listAvailableAreas, listAvailableCities } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";
import FormModal from "../../components/admin/FormModal";
import { TableActionCell, TableActionHeader } from "../../components/admin/TableActionButtons";
import CFAreaFormLayer from "./CFAreaFormLayer";

const CFAreaListLayer = () => {
  const [items, setItems] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [areaResponse, cityResponse] = await Promise.all([
        listAvailableAreas({ purpose: "all", limit: 100, offset: 0 }),
        listAvailableCities({ purpose: "all", limit: 100, offset: 0 }),
      ]);
      setItems(areaResponse.items || []);
      setCities(cityResponse.items || []);
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cityById = useMemo(() => new Map(cities.map((city) => [city.id, city.name])), [cities]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((area) => {
      if (status === "active" && area.isActive === false) return false;
      if (status === "inactive" && area.isActive !== false) return false;
      if (!query) return true;
      const cityName = area.cityName || cityById.get(area.cityId) || "";
      return (area.name || "").toLowerCase().includes(query) ||
        cityName.toLowerCase().includes(query) ||
        (area.postalCode || "").toLowerCase().includes(query);
    });
  }, [items, cityById, search, status]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this area?")) return;
    try {
      await deleteAvailableArea(id);
      toast.success("Area deleted.");
      await load();
    } catch (deleteError) {
      toast.error(deleteError instanceof ApiError ? deleteError.message : String(deleteError));
    }
  };

  return (
    <div className='card h-100 p-0 radius-12'>
      <div className='card-header border-bottom bg-base py-16 px-24 p4u-admin-filter-row align-items-center gap-3 justify-content-between'>
        <div className='p4u-admin-filter-row align-items-center gap-3'>
          <form className='navbar-search' onSubmit={(event) => event.preventDefault()}>
            <input type='text' className='bg-base h-40-px w-auto' placeholder='Search area, city or postal code...' value={search} onChange={(event) => setSearch(event.target.value)} />
            <Icon icon='ion:search-outline' className='icon' />
          </form>
          <select className='form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px' value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value='all'>All statuses</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
        </div>
        <button type='button' onClick={() => setModal({ mode: "add" })} className='btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2'>
          <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' /> Add Area
        </button>
      </div>
      <div className='card-body p-24'>
        {error && <div className='alert alert-danger radius-12 mb-16' role='alert'>{error}</div>}
        {loading ? <p className='text-secondary-light mb-0'>Loading areas...</p> : (
          <div className='table-responsive scroll-sm'>
            <table className='table bordered-table sm-table mb-0 text-nowrap'>
              <thead><tr>
                <th>ID</th><th>Area Name</th><th>City</th><th>Postal Code</th><th className='text-center'>Active</th><th>Created</th><TableActionHeader />
              </tr></thead>
              <tbody>
                {!filtered.length ? <tr><td colSpan='7' className='text-center py-4'>No areas found.</td></tr> : filtered.map((area) => (
                  <tr key={area.id}>
                    <td><span className='text-xs' title={area.id}>{area.id}</span></td>
                    <td><span className='fw-semibold text-primary-light'>{area.name || "—"}</span></td>
                    <td>{area.cityName || cityById.get(area.cityId) || "—"}</td>
                    <td>{area.postalCode || "—"}</td>
                    <td className='text-center'>
                      <span className={`px-12 py-4 radius-4 fw-medium text-sm ${area.isActive !== false ? "bg-success-focus text-success-600 border border-success-main" : "bg-danger-focus text-danger-600 border border-danger-main"}`}>
                        {area.isActive !== false ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>{formatDateTime(area.createdAt)}</td>
                    <TableActionCell actions={[
                      { type: "view", onClick: () => setModal({ mode: "view", id: area.id }) },
                      { type: "edit", onClick: () => setModal({ mode: "edit", id: area.id }) },
                      { type: "delete", onClick: () => handleDelete(area.id) },
                    ]} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className='p4u-admin-filter-row align-items-center justify-content-between gap-2 mt-24'>
          <span>Showing {filtered.length ? 1 : 0} to {filtered.length} of {filtered.length} entries</span>
        </div>
      </div>
      {modal && (
        <FormModal onClose={() => setModal(null)} size='md'>
          <CFAreaFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            initialData={modal.id ? items.find((area) => area.id === modal.id) || null : null}
            cities={cities}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default CFAreaListLayer;
