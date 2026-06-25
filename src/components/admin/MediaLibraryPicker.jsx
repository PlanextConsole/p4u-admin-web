import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  listMediaLibraryAssets,
  listMediaLibraryFolders,
  uploadMediaLibraryFiles,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { resolveMediaUrl } from "../../lib/resolveMediaUrl";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";
import { formatUploadError, imageUploadFilename, validateImageFile } from "../../lib/uploadHelpers";
import FormModal from "./FormModal";

function isImageAsset(asset) {
  const mime = String(asset?.mime || "").toLowerCase();
  const url = String(asset?.fileUrl || asset?.url || "").toLowerCase();
  return mime.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg|avif|heic|heif|bmp)$/i.test(url);
}

/**
 * Modal to pick an image from the admin media library.
 * @param {{ open: boolean, onClose: () => void, onSelect: (url: string) => void, title?: string }} props
 */
export default function MediaLibraryPicker({ open, onClose, onSelect, title = "Choose from Media Library" }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [assets, setAssets] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await listMediaLibraryFolders({ kind: "general" });
      const items = Array.isArray(res.items) ? res.items : [];
      setFolders(items);
      setSelectedFolderId((prev) => prev || items[0]?.id || "");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const loadAssets = useCallback(async () => {
    if (!selectedFolderId) {
      setAssets([]);
      return;
    }
    setLoadingAssets(true);
    try {
      const res = await listMediaLibraryAssets(selectedFolderId, { limit: 120, offset: 0 });
      setAssets((Array.isArray(res.items) ? res.items : []).filter(isImageAsset));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    if (open) loadFolders();
  }, [open, loadFolders]);

  useEffect(() => {
    if (open && selectedFolderId) loadAssets();
  }, [open, selectedFolderId, loadAssets]);

  const handleUploadToFolder = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedFolderId) return;
    const err = validateImageFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setUploading(true);
    try {
      const renamed = new File([file], imageUploadFilename(file), { type: file.type || "application/octet-stream" });
      const res = await uploadMediaLibraryFiles(selectedFolderId, [renamed]);
      const created = Array.isArray(res.items) ? res.items : res.files || [];
      await loadAssets();
      const first = created[0];
      const url = first?.fileUrl || first?.url;
      if (url) {
        onSelect(url);
        onClose();
      } else {
        toast.success("Uploaded to media library.");
      }
    } catch (uploadErr) {
      toast.error(formatUploadError(uploadErr, "Media library upload failed"));
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <FormModal title={title} onClose={onClose} size="lg">
      <div className="d-flex flex-column gap-12">
        <div className="d-flex flex-wrap align-items-center gap-10">
          <select
            className="form-select radius-10"
            style={{ minWidth: 220 }}
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            disabled={loadingFolders || uploading}
          >
            <option value="">Select folder…</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <label className="btn btn-light border radius-10 mb-0">
            <Icon icon="mdi:upload" className="me-6" />
            Upload here
            <input type="file" className="d-none" accept={IMAGE_ACCEPT} onChange={handleUploadToFolder} disabled={!selectedFolderId || uploading} />
          </label>
        </div>

        {loadingFolders || loadingAssets ? (
          <p className="text-secondary-light mb-0">Loading…</p>
        ) : !selectedFolderId ? (
          <p className="text-secondary-light mb-0">Select a folder to browse images.</p>
        ) : assets.length === 0 ? (
          <p className="text-secondary-light mb-0">No images in this folder yet. Upload one above.</p>
        ) : (
          <div className="d-flex flex-wrap gap-10" style={{ maxHeight: 360, overflowY: "auto" }}>
            {assets.map((asset) => {
              const url = asset.fileUrl || asset.url;
              return (
                <button
                  key={asset.id}
                  type="button"
                  className="border radius-10 p-4 bg-white"
                  style={{ width: 96, height: 96 }}
                  title={asset.originalName || "Select image"}
                  onClick={() => {
                    if (url) {
                      onSelect(url);
                      onClose();
                    }
                  }}
                >
                  <img
                    src={resolveMediaUrl(url)}
                    alt={asset.originalName || "Media"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FormModal>
  );
}
