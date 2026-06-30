import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import {
  downloadBulkUploadSource,
  downloadBulkSampleCsv,
  listBulkUploadJobs,
  retryBulkUploadJob,
  submitBulkCsvUpload,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";

const UPLOAD_TYPES = [
  { value: "product", label: "Products" },
  { value: "customer", label: "Customers" },
  { value: "vendor", label: "Vendors" },
];

function typeLabel(t) {
  const u = String(t || "").toLowerCase();
  if (u === "customer" || u === "customers") return "Customer";
  if (u === "vendor" || u === "vendors") return "Vendor";
  return "Product";
}

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "completed") {
    return <span className='p4u-file-status is-completed'><Icon icon='mdi:check-circle-outline' />Completed</span>;
  }
  if (s === "partial") {
    return <span className='p4u-file-status is-partial'><Icon icon='mdi:alert-outline' />Partial</span>;
  }
  if (s === "failed") {
    return <span className='p4u-file-status is-failed'><Icon icon='mdi:close-circle-outline' />Failed</span>;
  }
  return <span className='p4u-file-status is-processing'><Icon icon='mdi:progress-clock' />Processing</span>;
}

const FileUploadsLayer = () => {
  const [uploadType, setUploadType] = useState("product");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [retryingId, setRetryingId] = useState("");

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await listBulkUploadJobs({ limit: 50, offset: 0 });
      setJobs(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSample = async () => {
    try {
      await downloadBulkSampleCsv(uploadType);
      toast.success("Sample CSV downloaded.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a CSV file.");
      return;
    }
    setUploading(true);
    try {
      await submitBulkCsvUpload(uploadType, file);
      toast.success("Upload processed.");
      setFile(null);
      await loadJobs();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSource = async (id) => {
    try {
      await downloadBulkUploadSource(id);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    }
  };

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      await retryBulkUploadJob(id);
      toast.success("Retry completed.");
      await loadJobs();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : String(e));
    } finally {
      setRetryingId("");
    }
  };

  const helpProduct = uploadType === "product";
  const sampleLabel = uploadType === "product" ? "Sample product CSV" : uploadType === "customer" ? "Sample customer CSV" : "Sample vendor CSV";

  return (
    <div className='p4u-file-page'>
      <header className='p4u-file-hero'>
        <h1>File Uploads</h1>
        <p>Bulk upload products, customers, and vendors via CSV. Leave ID blank to create, provide existing ID to update.</p>
      </header>

      <section className='p4u-file-upload-card'>
        <form onSubmit={handleSubmit}>
          <div className='p4u-file-upload-row'>
            <label className='p4u-file-field p4u-file-type'>
              <span>Upload Type</span>
              <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                {UPLOAD_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>

            <div className='p4u-file-field p4u-file-picker'>
              <span>CSV File</span>
              <div>
                <label>
                  <input type='file' accept='.csv,text/csv' onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  Choose file
                </label>
                <em>{file ? file.name : "No file chosen"}</em>
              </div>
            </div>

            <div className='p4u-file-actions'>
              <button type='button' onClick={handleSample} className='p4u-file-outline-btn'>
                <Icon icon='mdi:download-outline' />
                <span>{sampleLabel}</span>
              </button>
              <button type='button' onClick={() => loadJobs()} disabled={loadingJobs} className='p4u-file-ghost-btn'>
                <Icon icon='mdi:refresh' />
                <span>Refresh</span>
              </button>
              <button type='submit' disabled={uploading} className='p4u-file-upload-btn'>
                <Icon icon='mdi:upload-outline' />
                <span>{uploading ? "Uploading..." : "Upload & process"}</span>
              </button>
            </div>
          </div>

          <div className='p4u-file-help'>
            {helpProduct ? (
              <>
                <p><strong>Product CSV supports:</strong> All product fields including images, SEO, pricing, and up to 5 attribute name/value pairs.</p>
                <p><strong>Create vs Update:</strong> Leave <code>id</code> empty to create. Provide existing ID to update.</p>
                <p><strong>Attributes:</strong> Attribute names must exist in the Attributes master. Use pipe (<code>|</code>) to separate multiple image URLs.</p>
              </>
            ) : uploadType === "customer" ? (
              <p><strong>Customers:</strong> Leave <code>id</code> empty to create. Provide <code>id</code> to update. Supported columns include full name, email, phone, status, occupation, and Keycloak user ID.</p>
            ) : (
              <p><strong>Vendors:</strong> Leave <code>id</code> empty to create. Provide <code>id</code> to update. Include business name and vendor kind as product or service.</p>
            )}
          </div>
        </form>
      </section>

      <section className='p4u-file-table-card'>
        <div className='p4u-file-table-wrap'>
          <table className='p4u-file-table'>
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Status</th>
                <th>Total</th>
                <th>Success</th>
                <th>Errors</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingJobs ? (
                <tr><td colSpan={8} className='p4u-file-empty'>Loading...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={8} className='p4u-file-empty'>No uploads yet.</td></tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id}>
                    <td className='p4u-file-name' title={j.originalFilename}>{j.originalFilename}</td>
                    <td><span className='p4u-file-type-pill'>{typeLabel(j.uploadType)}</span></td>
                    <td>{statusBadge(j.status)}</td>
                    <td>{j.totalRows ?? 0}</td>
                    <td className='is-success'>{j.successCount ?? 0}</td>
                    <td className='is-error'>{j.errorCount ?? 0}</td>
                    <td className='p4u-file-date'>{formatDateTime(j.createdAt)}</td>
                    <td>
                      <div className='p4u-file-row-actions'>
                        <button type='button' onClick={() => handleDownloadSource(j.id)}><Icon icon='mdi:download-outline' /> CSV</button>
                        <button type='button' disabled={retryingId === j.id} onClick={() => handleRetry(j.id)}><Icon icon='mdi:refresh' /> Re-process</button>
                        <button type='button' onClick={() => handleDownloadSource(j.id)}><Icon icon='mdi:download-outline' /> Full Report</button>
                        {(j.errorCount ?? 0) > 0 && <button type='button' className='is-danger' onClick={() => handleDownloadSource(j.id)}><Icon icon='mdi:download-outline' /> Errors</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default FileUploadsLayer;
