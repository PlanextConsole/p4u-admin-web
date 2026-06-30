import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  deletePopupBanner,
  listPopupBanners,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";
import TableActionButtons from "../../components/admin/TableActionButtons";
import PopupBannerFormLayer from "./PopupBannerFormLayer";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { formatDateTime } from "../../lib/formatters";

function statusText(row) {
  return row?.isActive !== false ? "Active" : "Inactive";
}

function dateOnly(value) {
  if (!value) return "-";
  const full = formatDateTime(value);
  return full || "-";
}

function popupId(row, index) {
  return row.slug || row.key || row.code || row.id || `popup-${index + 1}`;
}

function popupSubtitle(row) {
  const meta = row.metadata || {};
  return meta.subtitle || meta.description || meta.caption || meta.storeSubtitle || "-";
}

function popupLink(row) {
  const meta = row.metadata || {};
  return row.redirectUrl || meta.link || meta.deepLink || meta.ctaLink || meta.redirectUrl || meta.screenId || "-";
}

function startDate(row) {
  const meta = row.metadata || {};
  return meta.startDate || meta.validFrom || row.startDate || row.createdAt || null;
}

function endDate(row) {
  const meta = row.metadata || {};
  return meta.endDate || meta.validTo || row.endDate || null;
}

function exportRows(rows) {
  const headers = ["ID", "Title", "Subtitle", "Link", "Start Date", "End Date", "Status", "Created", "Updated"];
  const csvRows = rows.map((row, index) => [
    popupId(row, index),
    row.title || "",
    popupSubtitle(row),
    popupLink(row),
    dateOnly(startDate(row)),
    dateOnly(endDate(row)),
    statusText(row),
    dateOnly(row.createdAt),
    dateOnly(row.updatedAt),
  ]);
  const csv = [headers, ...csvRows]
    .map((cols) => cols.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "popup-banners.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const PopupBannerListLayer = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listPopupBanners();
      setItems(res.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row, index) => {
      const meta = row.metadata || {};
      const matchesSearch = !q ||
        popupId(row, index).toLowerCase().includes(q) ||
        (row.title || "").toLowerCase().includes(q) ||
        popupSubtitle(row).toLowerCase().includes(q) ||
        popupLink(row).toLowerCase().includes(q) ||
        String(meta.screenId || "").toLowerCase().includes(q);
      const matchesStatus = status === "all" || (status === "active" ? row.isActive !== false : row.isActive === false);
      return matchesSearch && matchesStatus;
    });
  }, [items, search, status]);

  const rowForId = (id) => items.find((b) => b.id === id) || null;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this popup banner?")) return;
    try {
      await deletePopupBanner(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  return (
    <div className='p4u-popup-page'>
      <header className='p4u-popup-hero'>
        <h1>Popup Banners</h1>
        <p>{items.length} popup banners configured</p>
      </header>

      <section className='p4u-popup-card'>
        <div className='p4u-popup-toolbar'>
          <div className='p4u-popup-search'>
            <Icon icon='mdi:magnify' />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search...' />
          </div>
          <select className='p4u-popup-status-filter' value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value='all'>Status</option>
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
          <div className='p4u-popup-toolbar-actions'>
            <button type='button' onClick={() => setModal({ mode: "add" })} className='p4u-popup-add-btn'>
              <Icon icon='ic:baseline-plus' /> Add Popup Banner
            </button>
            <button type='button' onClick={() => exportRows(filtered)} className='p4u-popup-export-btn'>
              <Icon icon='mdi:download-outline' /> Export CSV
            </button>
          </div>
        </div>

        {error && <div className='p4u-popup-alert'>{error}</div>}

        <div className='p4u-popup-table-wrap'>
          <table className='p4u-popup-table'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Title</th>
                <th>Link</th>
                <th>Start<br />Date</th>
                <th>End<br />Date</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className='p4u-popup-empty'>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className='p4u-popup-empty'>No popup banners found.</td></tr>
              ) : (
                filtered.map((item, index) => {
                  const link = popupLink(item);
                  return (
                    <tr key={item.id} className={index === 0 ? 'is-featured' : ''}>
                      <td className='p4u-popup-id'>{popupId(item, index)}</td>
                      <td>
                        <div className='p4u-popup-thumb'>
                          {item.imageUrl ? (
                            <img src={resolveMediaUrl(item.imageUrl)} alt='' onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <Icon icon='mdi:image-outline' />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className='p4u-popup-title'>{item.title || "-"}</div>
                        <div className='p4u-popup-subtitle'>{popupSubtitle(item)}</div>
                      </td>
                      <td><span className='p4u-popup-link'>{link}</span></td>
                      <td>{dateOnly(startDate(item))}</td>
                      <td>{dateOnly(endDate(item))}</td>
                      <td><span className={item.isActive !== false ? 'p4u-popup-pill is-active' : 'p4u-popup-pill is-inactive'}>{statusText(item)}</span></td>
                      <td className='p4u-popup-date'>{dateOnly(item.createdAt)}</td>
                      <td className='p4u-popup-date'>{dateOnly(item.updatedAt)}</td>
                      <td>
                        <TableActionButtons
                          actions={[
                            { type: "view", onClick: () => setModal({ mode: "view", id: item.id }) },
                            { type: "edit", onClick: () => setModal({ mode: "edit", id: item.id }) },
                            { type: "delete", onClick: () => handleDelete(item.id) },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <FormModal onClose={() => setModal(null)} size='md'>
          <PopupBannerFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            initialData={modal.id ? rowForId(modal.id) : null}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default PopupBannerListLayer;
