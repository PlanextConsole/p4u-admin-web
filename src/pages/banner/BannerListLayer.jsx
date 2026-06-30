import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { deleteBanner, listBanners } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";
import BannerFormLayer from "./BannerFormLayer";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { formatDateTime } from "../../lib/formatters";

const isStandaloneBanner = (banner) => {
  const meta = banner.metadata || {};
  return meta.homepageCMS !== true && meta.onboardingCMS !== true;
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const BannerListLayer = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listBanners();
      setItems((res.items || []).filter(isStandaloneBanner));
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
    if (!q) return items;
    return items.filter((banner) => {
      const meta = banner.metadata || {};
      return [
        banner.id,
        banner.title,
        meta.subtitle,
        banner.redirectUrl,
        meta.desktopImageUrl,
        meta.mobileImageUrl,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [items, search]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((banner) => banner.isActive !== false).length;
    return { total, active, inactive: total - active };
  }, [items]);

  const rowForId = (id) => items.find((banner) => banner.id === id) || null;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteBanner(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((banner) => {
      const meta = banner.metadata || {};
      return [
        banner.id,
        banner.title,
        meta.subtitle || "",
        banner.redirectUrl || "",
        banner.sortOrder ?? 0,
        banner.isActive !== false ? "Active" : "Inactive",
        banner.createdAt || "",
        banner.updatedAt || "",
      ];
    });
    const csv = [
      ["ID", "Title", "Subtitle", "Link", "Priority", "Status", "Created", "Updated"],
      ...rows,
    ]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "banners.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='p4u-banner-page'>
      <section className='p4u-banner-hero'>
        <h1>Banners</h1>
        <p>{items.length} banners configured &mdash; these appear on the home page carousel</p>
      </section>

      <section className='p4u-banner-stats' aria-label='Banner summary'>
        <article className='p4u-banner-stat-card is-total'>
          <Icon icon='mdi:image-outline' />
          <div>
            <span>Total Banners</span>
            <strong>{stats.total}</strong>
          </div>
        </article>
        <article className='p4u-banner-stat-card is-active'>
          <Icon icon='mdi:check-circle-outline' />
          <div>
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
        </article>
        <article className='p4u-banner-stat-card is-inactive'>
          <Icon icon='mdi:clock-outline' />
          <div>
            <span>Inactive</span>
            <strong>{stats.inactive}</strong>
          </div>
        </article>
      </section>

      <section className='p4u-banner-card'>
        <div className='p4u-banner-toolbar'>
          <label className='p4u-banner-search'>
            <Icon icon='ion:search-outline' />
            <input
              type='search'
              placeholder='Search...'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className='p4u-banner-toolbar-actions'>
            <button type='button' className='p4u-banner-add-btn' onClick={() => setModal({ mode: "add" })}>
              <Icon icon='ic:round-plus' />
              Add New
            </button>
            <button type='button' className='p4u-banner-export-btn' onClick={exportCsv}>
              <Icon icon='lucide:download' />
              Export CSV
            </button>
          </div>
        </div>

        {error && <div className='p4u-banner-error'>{error}</div>}

        <div className='p4u-banner-table-wrap'>
          <table className='p4u-banner-table'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Preview</th>
                <th>Banner</th>
                <th>Link</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th aria-label='Actions' />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan='9' className='p4u-banner-empty'>Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan='9' className='p4u-banner-empty'>No banners found.</td>
                </tr>
              ) : (
                filtered.map((banner) => {
                  const meta = banner.metadata || {};
                  const preview = meta.desktopImageUrl || banner.imageUrl;
                  return (
                    <tr key={banner.id}>
                      <td className='p4u-banner-id' title={banner.id}>{banner.id}</td>
                      <td>
                        {preview ? (
                          <img
                            className='p4u-banner-thumb'
                            src={resolveMediaUrl(preview)}
                            alt={banner.title || "Banner preview"}
                            onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
                          />
                        ) : (
                          <span className='p4u-banner-thumb is-empty' />
                        )}
                      </td>
                      <td>
                        <div className='p4u-banner-title' title={banner.title || "Untitled"}>{banner.title || "Untitled"}</div>
                        {meta.subtitle ? <div className='p4u-banner-subtitle' title={meta.subtitle}>{meta.subtitle}</div> : null}
                      </td>
                      <td>
                        <span className='p4u-banner-link' title={banner.redirectUrl || "/app/browse"}>{banner.redirectUrl || "/app/browse"}</span>
                      </td>
                      <td className='p4u-banner-priority'>#{banner.sortOrder ?? 0}</td>
                      <td>
                        <span className={`p4u-banner-pill ${banner.isActive !== false ? "is-active" : "is-inactive"}`}>
                          {banner.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className='p4u-banner-muted'>{formatDateTime(banner.createdAt)}</td>
                      <td className='p4u-banner-muted'>{formatDateTime(banner.updatedAt)}</td>
                      <td>
                        <div className='p4u-banner-row-actions'>
                          <button type='button' aria-label='View banner' onClick={() => setModal({ mode: "view", id: banner.id })}>
                            <Icon icon='lucide:eye' />
                          </button>
                          <button type='button' aria-label='Edit banner' onClick={() => setModal({ mode: "edit", id: banner.id })}>
                            <Icon icon='lucide:pencil' />
                          </button>
                          <button type='button' aria-label='Delete banner' className='is-danger' onClick={() => handleDelete(banner.id)}>
                            <Icon icon='lucide:trash-2' />
                          </button>
                        </div>
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
          <BannerFormLayer
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

export default BannerListLayer;
