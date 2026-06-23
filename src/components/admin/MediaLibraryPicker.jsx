import React, { useCallback, useEffect, useState } from "react";
import { listMediaLibraryAssets, listMediaLibraryFolders } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import FormModal from "./FormModal";

/**
 * Modal to pick an image URL from the admin media library.
 * @param {{ open: boolean, onClose: () => void, onSelect: (url: string) => void, title?: string }} props
 */
const MediaLibraryPicker = ({ open, onClose, onSelect, title = "Choose from Media Library" }) => {
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listMediaLibraryFolders({ kind: "all" });
      const items = res.items || [];
      setFolders(items);
      if (items.length && !folderId) setFolderId(items[0].id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  const loadAssets = useCallback(async () => {
    if (!folderId) {
      setAssets([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await listMediaLibraryAssets(folderId, { limit: 100, offset: 0 });
      const items = (res.items || []).filter((a) => {
        const m = String(a.mimeType || a.mime || "").toLowerCase();
        return !m || m.startsWith("image/");
      });
      setAssets(items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    if (!open) return;
    loadFolders();
  }, [open, loadFolders]);

  useEffect(() => {
    if (!open || !folderId) return;
    loadAssets();
  }, [open, folderId, loadAssets]);

  if (!open) return null;

  return (
    <FormModal onClose={onClose} size="lg">
      <div className="p-20">
        <h5 className="fw-semibold mb-16">{title}</h5>
        {error && <div className="alert alert-danger radius-8 text-sm py-8">{error}</div>}
        <div className="mb-12">
          <label className="form-label text-sm fw-semibold">Folder</label>
          <select
            className="form-select radius-8"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={loading || !folders.length}
          >
            {!folders.length ? <option value="">No folders</option> : null}
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-secondary-light text-sm mb-0">Loading…</p>
        ) : assets.length === 0 ? (
          <p className="text-secondary-light text-sm mb-0">No images in this folder. Upload files in Media Library first.</p>
        ) : (
          <div className="d-flex flex-wrap gap-10" style={{ maxHeight: 360, overflowY: "auto" }}>
            {assets.map((a) => {
              const url = a.fileUrl || a.url || "";
              const src = resolveMediaUrl(url) || url;
              return (
                <button
                  key={a.id}
                  type="button"
                  className="border radius-8 p-4 bg-white"
                  style={{ width: 96 }}
                  onClick={() => {
                    if (url) {
                      onSelect(url);
                      onClose();
                    }
                  }}
                  title={a.originalName || a.filename || "Select"}
                >
                  <img
                    src={src}
                    alt=""
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="text-xs text-truncate mt-4" style={{ maxWidth: 88 }}>
                    {a.originalName || a.filename || "Image"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FormModal>
  );
};

export default MediaLibraryPicker;
