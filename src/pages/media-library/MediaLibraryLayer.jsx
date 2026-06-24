import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  createMediaLibraryFolder,
  deleteMediaLibraryAsset,
  listMediaLibraryAssets,
  listMediaLibraryFolders,
  uploadMediaLibraryFiles,
  uploadMediaLibraryZip,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { formatDateTime } from "../../lib/formatters";
import FormModal from "../../components/admin/FormModal";
import { TableActionButton } from "../../components/admin/TableActionButtons";

const TABS = [
  { key: "media", label: "Media Files", icon: "mdi:folder-outline" },
  { key: "kyc", label: "KYC Documents", icon: "mdi:shield-account-outline" },
];

function formatBytes(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return "—";
  if (x < 1024) return `${x} B`;
  if (x < 1024 * 1024) return `${(x / 1024).toFixed(1)} KB`;
  if (x < 1024 * 1024 * 1024) return `${(x / (1024 * 1024)).toFixed(1)} MB`;
  return `${(x / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isImageMime(m) {
  return typeof m === "string" && m.startsWith("image/");
}

const MediaLibraryLayer = () => {
  const [tab, setTab] = useState("media");
  const [folderSearch, setFolderSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetsTotal, setAssetsTotal] = useState(0);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [showZipModal, setShowZipModal] = useState(false);
  const [zipTargetId, setZipTargetId] = useState("");
  const [zipFile, setZipFile] = useState(null);
  const [zipBusy, setZipBusy] = useState(false);

  const filesInputRef = React.useRef(null);
  const zipInputRef = React.useRef(null);

  const folderKind = tab === "kyc" ? "kyc" : "general";

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(folderSearch), 400);
    return () => clearTimeout(t);
  }, [folderSearch]);

  useEffect(() => {
    if (tab !== "media" && tab !== "kyc") setSelectedFolder(null);
  }, [tab]);

  const loadFolders = useCallback(async () => {
    if (tab !== "media" && tab !== "kyc") return;
    setLoadingFolders(true);
    try {
      const res = await listMediaLibraryFolders({
        kind: folderKind,
        q: debouncedQ.trim() || undefined,
      });
      setFolders(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  }, [tab, folderKind, debouncedQ]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const loadAssets = useCallback(async () => {
    if (!selectedFolder?.id) return;
    setLoadingAssets(true);
    try {
      const res = await listMediaLibraryAssets(selectedFolder.id, { limit: 100, offset: 0 });
      setAssets(Array.isArray(res.items) ? res.items : []);
      setAssetsTotal(typeof res.total === "number" ? res.total : 0);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [selectedFolder?.id]);

  useEffect(() => {
    if (selectedFolder?.id) loadAssets();
    else {
      setAssets([]);
      setAssetsTotal(0);
    }
  }, [selectedFolder?.id, loadAssets]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) {
      toast.error("Folder name is required.");
      return;
    }
    setCreatingFolder(true);
    try {
      await createMediaLibraryFolder({ name, kind: folderKind });
      toast.success("Folder created.");
      setNewFolderName("");
      setShowNewFolder(false);
      await loadFolders();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setCreatingFolder(false);
    }
  };

  const openZipModal = () => {
    if (!folders.length) {
      toast.info("Create a folder first.");
      return;
    }
    setZipTargetId(selectedFolder?.id || folders[0]?.id || "");
    setZipFile(null);
    setShowZipModal(true);
  };

  const submitZip = async (e) => {
    e.preventDefault();
    if (!zipTargetId) {
      toast.error("Choose a target folder.");
      return;
    }
    if (!zipFile) {
      toast.error("Choose a ZIP file.");
      return;
    }
    setZipBusy(true);
    try {
      const res = await uploadMediaLibraryZip(zipTargetId, zipFile);
      toast.success(`Extracted ${res.created ?? 0} file(s).`);
      setShowZipModal(false);
      setZipFile(null);
      await loadFolders();
      if (selectedFolder?.id === zipTargetId) await loadAssets();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setZipBusy(false);
    }
  };

  const uploadDropped = async (fileList) => {
    const arr = Array.from(fileList || []).filter((f) => f.size > 0);
    if (!arr.length) return;
    if (!selectedFolder?.id) {
      toast.info("Open a folder first, then drop files there.");
      return;
    }
    try {
      await uploadMediaLibraryFiles(selectedFolder.id, arr);
      toast.success(`Uploaded ${arr.length} file(s).`);
      await loadAssets();
      await loadFolders();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    uploadDropped(e.dataTransfer?.files);
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Delete this file from the library?")) return;
    try {
      await deleteMediaLibraryAsset(id);
      toast.success("Deleted.");
      await loadAssets();
      await loadFolders();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    }
  };

  const renderFolderGrid = () => (
    <div>
      <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mb-16'>
        <h5 className='fw-bold mb-0'>Folders</h5>
        <div className='d-flex flex-wrap align-items-center gap-8'>
          <div className='input-group radius-10' style={{ width: 220, maxWidth: "100%" }}>
            <span className='input-group-text bg-base border-end-0'>
              <Icon icon='mdi:magnify' />
            </span>
            <input
              className='form-control border-start-0 radius-10'
              placeholder='Search folders…'
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
            />
          </div>
          <button type='button' className='btn btn-outline-primary radius-10' onClick={() => setShowNewFolder(true)}>
            <Icon icon='mdi:folder-plus-outline' className='text-lg me-4' />
            New Folder
          </button>
          <button type='button' className='btn btn-outline-secondary radius-10' onClick={openZipModal}>
            <Icon icon='mdi:folder-zip-outline' className='text-lg me-4' />
            Upload ZIP
          </button>
        </div>
      </div>
      {loadingFolders ? (
        <p className='text-secondary-light'>Loading…</p>
      ) : (
        <div className='row g-16'>
          {folders.map((f) => (
            <div key={f.id} className='col-sm-6 col-md-4 col-lg-3'>
              <button
                type='button'
                className='card border-0 shadow-sm radius-12 p-20 w-100 text-start bg-base h-100 hover-border-primary-200'
                style={{ border: "1px solid var(--neutral-200, #e9ecef)" }}
                onClick={() => setSelectedFolder(f)}
              >
                <div className='d-flex flex-column align-items-center text-center gap-8'>
                  <Icon icon='mdi:folder-outline' className='text-4xl text-primary-600' />
                  <div className='fw-semibold text-truncate w-100' title={f.name}>
                    {f.name}
                  </div>
                  <span className='badge bg-primary-50 text-primary-600 radius-8'>
                    {f.fileCount ? `${f.fileCount} files` : "Empty"}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFolderDetail = () => (
    <div
      className={`radius-12 p-20 ${dragActive ? "border border-primary-600 bg-primary-50" : "border"}`}
      style={{ borderColor: "var(--neutral-200, #e9ecef)" }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className='d-flex flex-wrap align-items-center justify-content-between gap-12 mb-16'>
        <div className='d-flex align-items-center gap-12'>
          <button type='button' className='btn btn-sm btn-outline-secondary radius-8' onClick={() => setSelectedFolder(null)}>
            <Icon icon='mdi:arrow-left' className='text-lg' />
            Back
          </button>
          <h5 className='fw-bold mb-0'>{selectedFolder.name}</h5>
          <span className='text-secondary-light text-sm'>{assetsTotal} files</span>
        </div>
        <div className='d-flex flex-wrap gap-8'>
          <input ref={filesInputRef} type='file' multiple className='d-none' onChange={(e) => uploadDropped(e.target.files)} />
          <button type='button' className='btn btn-primary radius-10' onClick={() => filesInputRef.current?.click()}>
            <Icon icon='mdi:upload' className='text-lg me-4' />
            Upload files
          </button>
          <button
            type='button'
            className='btn btn-outline-secondary radius-10'
            onClick={() => {
              setZipTargetId(selectedFolder.id);
              zipInputRef.current?.click();
            }}
          >
            <Icon icon='mdi:folder-zip-outline' className='text-lg me-4' />
            Upload ZIP
          </button>
          <input
            ref={zipInputRef}
            type='file'
            accept='.zip,application/zip'
            className='d-none'
            onChange={async (e) => {
              const z = e.target.files?.[0];
              e.target.value = "";
              if (!z || !selectedFolder) return;
              try {
                const res = await uploadMediaLibraryZip(selectedFolder.id, z);
                toast.success(`Extracted ${res.created ?? 0} file(s).`);
                await loadAssets();
                await loadFolders();
              } catch (err) {
                toast.error(err instanceof ApiError ? err.message : String(err));
              }
            }}
          />
        </div>
      </div>
      {loadingAssets ? (
        <p className='text-secondary-light'>Loading…</p>
      ) : assets.length === 0 ? (
        <p className='text-secondary-light mb-0'>No files in this folder yet. Drop files here or use Upload.</p>
      ) : (
        <div className='row g-12'>
          {assets.map((a) => (
            <div key={a.id} className='col-6 col-md-4 col-lg-3 col-xl-2'>
              <div className='border radius-12 overflow-hidden h-100 position-relative bg-neutral-50'>
                <div className='bg-base d-flex align-items-center justify-content-center' style={{ minHeight: 140 }}>
                  {isImageMime(a.mime) ? (
                    <img src={resolveMediaUrl(a.fileUrl) || a.fileUrl} alt='' className='object-fit-contain w-100 p-8' style={{ maxHeight: 140 }} />
                  ) : (
                    <Icon icon='mdi:file-document-outline' className='text-4xl text-secondary-light' />
                  )}
                </div>
                <div className='p-8'>
                  <div className='text-xs text-truncate' title={a.originalName}>
                    {a.originalName}
                  </div>
                  <div className='text-xs text-neutral-500'>{formatBytes(a.sizeBytes)}</div>
                  <div className='d-flex gap-10 mt-8 align-items-center justify-content-center'>
                    <a className='btn btn-outline-primary btn-sm py-0 px-8 radius-6' href={resolveMediaUrl(a.fileUrl) || a.fileUrl} target='_blank' rel='noreferrer'>
                      Open
                    </a>
                    <TableActionButton type='delete' onClick={() => handleDeleteAsset(a.id)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className='d-flex flex-wrap gap-8 mb-24'>
        {TABS.map((t) => (
          <button
            key={t.key}
            type='button'
            className={`btn radius-10 px-16 py-10 d-inline-flex align-items-center gap-8 ${
              tab === t.key ? "btn-primary shadow-sm" : "btn-outline-secondary"
            }`}
            onClick={() => setTab(t.key)}
          >
            <Icon icon={t.icon} className='text-xl' />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "media" && (
        <div className='card border-0 shadow-sm radius-16 p-24'>
          {!selectedFolder ? renderFolderGrid() : renderFolderDetail()}
        </div>
      )}

      {tab === "kyc" && (
        <div className='card border-0 shadow-sm radius-16 p-24'>
          {!selectedFolder ? renderFolderGrid() : renderFolderDetail()}
        </div>
      )}

      {showNewFolder && (
        <FormModal onClose={() => !creatingFolder && setShowNewFolder(false)} size='sm'>
          <h5 className='fw-bold mb-16'>New folder</h5>
          <form onSubmit={handleCreateFolder} className='d-flex flex-column gap-12'>
            <div>
              <label className='form-label text-sm fw-semibold'>Name</label>
              <input className='form-control radius-10' value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus />
            </div>
            <div className='d-flex gap-8 justify-content-end'>
              <button type='button' className='btn btn-outline-secondary radius-10' disabled={creatingFolder} onClick={() => setShowNewFolder(false)}>
                Cancel
              </button>
              <button type='submit' className='btn btn-primary radius-10' disabled={creatingFolder}>
                {creatingFolder ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </FormModal>
      )}

      {showZipModal && (
        <FormModal onClose={() => !zipBusy && setShowZipModal(false)} size='md'>
          <h5 className='fw-bold mb-16'>Upload ZIP</h5>
          <form onSubmit={submitZip} className='d-flex flex-column gap-16'>
            <div>
              <label className='form-label text-sm fw-semibold'>Target folder</label>
              <select className='form-select radius-10' value={zipTargetId} onChange={(e) => setZipTargetId(e.target.value)}>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='form-label text-sm fw-semibold'>ZIP file</label>
              <input type='file' accept='.zip,application/zip' className='form-control radius-10' onChange={(e) => setZipFile(e.target.files?.[0] || null)} />
            </div>
            <div className='d-flex gap-8 justify-content-end'>
              <button type='button' className='btn btn-outline-secondary radius-10' disabled={zipBusy} onClick={() => setShowZipModal(false)}>
                Cancel
              </button>
              <button type='submit' className='btn btn-primary radius-10' disabled={zipBusy}>
                {zipBusy ? "Uploading…" : "Upload & extract"}
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
};

export default MediaLibraryLayer;
