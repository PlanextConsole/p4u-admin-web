import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { deleteAdvertisement, listAdvertisements } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import FormModal from "../../components/admin/FormModal";
import AdvertisementFormLayer from "./AdvertisementFormLayer";
import { formatDateTime } from "../../lib/formatters";

const STATUS_OPTIONS = ["all", "active", "paused", "inactive"];

const prettyStatus = (status) => {
  const value = String(status || "active").toLowerCase();
  if (value === "inactive") return "Paused";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const normalizePages = (meta) => {
  const raw = meta?.pages;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) return raw.split(",").map((x) => x.trim()).filter(Boolean);
  return meta?.isSocioAd ? ["socio"] : ["all"];
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function campaignCountLabel(count) {
  return `${count} ad campaign${count === 1 ? "" : "s"}`;
}

const AdvertisementListLayer = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tab, setTab] = useState("all");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listAdvertisements({ limit: 200, offset: 0 });
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
    return items.filter((ad) => {
      const meta = ad.metadata || {};
      const pages = normalizePages(meta);
      const adStatus = String(ad.status || "active").toLowerCase();
      const start = meta.startDate ? String(meta.startDate).slice(0, 10) : "";
      const end = meta.endDate ? String(meta.endDate).slice(0, 10) : "";
      const isSocio = meta.isSocioAd === true || pages.includes("socio");
      const matchesTab = tab === "all" || isSocio;
      const matchesStatus = status === "all" || adStatus === status || (status === "paused" && adStatus === "inactive");
      const matchesFrom = !fromDate || !end || end >= fromDate;
      const matchesTo = !toDate || !start || start <= toDate;
      const matchesSearch = !q || [ad.id, ad.title, meta.caption, meta.advertiser, ad.redirectUrl, meta.linkType, meta.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      return matchesTab && matchesStatus && matchesFrom && matchesTo && matchesSearch;
    });
  }, [fromDate, items, search, status, tab, toDate]);

  const rowForId = (id) => items.find((ad) => ad.id === id) || null;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this advertisement?")) return;
    try {
      await deleteAdvertisement(id);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiError ? e.message : String(e));
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((ad) => {
      const meta = ad.metadata || {};
      return [
        ad.id,
        ad.title,
        meta.advertiser || "",
        ad.redirectUrl || "",
        normalizePages(meta).join(", "),
        meta.type || meta.postType || "Banner",
        meta.impressions ?? 0,
        meta.clicks ?? 0,
        meta.startDate || "",
        meta.endDate || "",
        prettyStatus(ad.status),
        ad.createdAt || "",
        ad.updatedAt || "",
      ];
    });
    const csv = [["ID", "Campaign", "Advertiser", "Link", "Pages", "Type", "Impressions", "Clicks", "Start", "End", "Status", "Created", "Updated"], ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = tab === "socio" ? "socio-advertisements.csv" : "advertisements.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openNew = () => setModal({ mode: "add", socio: tab === "socio" });

  return (
    <div className='p4u-ads-page'>
      <section className='p4u-ads-hero'>
        <div>
          <h1>Advertisements</h1>
          <p>{campaignCountLabel(filtered.length)}</p>
        </div>
        <button type='button' className='p4u-ads-new-btn' onClick={openNew}>
          <Icon icon='ic:round-plus' />
          {tab === "socio" ? "New Socio Ad" : "New Ad"}
        </button>
      </section>

      <div className='p4u-ads-tabs' role='tablist' aria-label='Advertisement type'>
        <button type='button' className={tab === "all" ? "is-active" : ""} onClick={() => setTab("all")}>All Ads</button>
        <button type='button' className={tab === "socio" ? "is-active" : ""} onClick={() => setTab("socio")}>Socio Advertisements</button>
      </div>

      <section className='p4u-ads-card'>
        <div className='p4u-ads-toolbar'>
          <div className='p4u-ads-filter-left'>
            <label className='p4u-ads-search'>
              <Icon icon='ion:search-outline' />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search...' />
            </label>
            <label className='p4u-ads-select'>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value='all'>Status</option>
                {STATUS_OPTIONS.filter((option) => option !== "all").map((option) => (
                  <option key={option} value={option}>{prettyStatus(option)}</option>
                ))}
              </select>
              <Icon icon='lucide:chevron-down' />
            </label>
          </div>
          <div className='p4u-ads-filter-right'>
            <label className='p4u-ads-date'>
              <Icon icon='lucide:calendar-days' />
              <span>From Date</span>
              <input type='date' value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label className='p4u-ads-date'>
              <Icon icon='lucide:calendar-days' />
              <span>To Date</span>
              <input type='date' value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
            <button type='button' className='p4u-ads-export' onClick={exportCsv}>
              <Icon icon='lucide:download' />
              Export CSV
            </button>
          </div>
        </div>

        {error && <div className='p4u-ads-error'>{error}</div>}

        <div className='p4u-ads-table-wrap'>
          <table className='p4u-ads-table'>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Link</th>
                <th>Pages</th>
                <th>Type</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Period</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th aria-label='Actions' />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan='11' className='p4u-ads-empty'>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan='11' className='p4u-ads-empty'>No advertisements found.</td></tr>
              ) : (
                filtered.map((ad) => {
                  const meta = ad.metadata || {};
                  const pages = normalizePages(meta);
                  const type = meta.type || meta.postType || (pages.includes("socio") ? "Sponsored" : "Banner");
                  return (
                    <tr key={ad.id}>
                      <td>
                        <div className='p4u-ads-campaign' title={ad.title || "Untitled"}>{ad.title || "Untitled"}</div>
                        {meta.advertiser ? <div className='p4u-ads-advertiser' title={meta.advertiser}>{meta.advertiser}</div> : null}
                      </td>
                      <td><span className='p4u-ads-chip'>{meta.linkLabel || meta.linkType || (ad.redirectUrl ? "Custom" : "Product")}</span></td>
                      <td className='p4u-ads-pages' title={pages.join(", ")}>{pages.join(", ")}</td>
                      <td><span className='p4u-ads-chip'>{type}</span></td>
                      <td>{Number(meta.impressions ?? 0).toLocaleString("en-IN")}</td>
                      <td>{Number(meta.clicks ?? 0).toLocaleString("en-IN")}</td>
                      <td className='p4u-ads-period' title={`${meta.startDate || "--"} → ${meta.endDate || "--"}`}>{meta.startDate || "--"} &rarr; {meta.endDate || "--"}</td>
                      <td><span className={`p4u-ads-pill ${String(ad.status || "active").toLowerCase() === "active" ? "is-active" : "is-paused"}`}>{prettyStatus(ad.status)}</span></td>
                      <td className='p4u-ads-muted'>{formatDateTime(ad.createdAt)}</td>
                      <td className='p4u-ads-muted'>{formatDateTime(ad.updatedAt)}</td>
                      <td>
                        <div className='p4u-ads-actions'>
                          <button type='button' aria-label='View advertisement' onClick={() => setModal({ mode: "view", id: ad.id })}><Icon icon='lucide:eye' /></button>
                          <button type='button' aria-label='Edit advertisement' onClick={() => setModal({ mode: "edit", id: ad.id })}><Icon icon='lucide:pencil' /></button>
                          <button type='button' aria-label='Delete advertisement' className='is-danger' onClick={() => handleDelete(ad.id)}><Icon icon='lucide:trash-2' /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 ? (
          <div className='p4u-ads-pagination'>
            <span>Showing 1&ndash;{filtered.length} of {filtered.length}</span>
            <div>
              <Icon icon='lucide:chevron-left' />
              <button type='button'>1</button>
              <Icon icon='lucide:chevron-right' />
            </div>
          </div>
        ) : null}
      </section>

      {modal && (
        <FormModal onClose={() => setModal(null)} size='lg'>
          <AdvertisementFormLayer
            isEdit={modal.mode === "edit"}
            isView={modal.mode === "view"}
            isSocioDefault={modal.socio}
            initialData={modal.id ? rowForId(modal.id) : null}
            onSuccess={() => { setModal(null); load(); }}
            onCancel={() => setModal(null)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default AdvertisementListLayer;
