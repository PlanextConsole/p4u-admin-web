import { ApiError } from "./api/client";

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif|heic|heif|jfif)$/i;

/** @param {File | Blob | null | undefined} file */
export function validateImageFile(file) {
  if (!file) return "No file selected";
  const name = String(file.name || "").toLowerCase();
  const type = String(file.type || "").toLowerCase();
  const extOk = IMAGE_EXT_RE.test(name);
  const typeOk =
    type.startsWith("image/") ||
    type === "" ||
    type === "application/octet-stream" ||
    type === "binary/octet-stream";
  if (!typeOk && !extOk) {
    return "File must be an image (JPEG, PNG, WebP, GIF, SVG, etc.)";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image must be under ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB`;
  }
  return null;
}

/** @param {unknown} err */
export function formatUploadError(err, fallback = "Upload failed") {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Ensures multipart uploads always include a filename (some browsers omit it for WebP). */
export function imageUploadFilename(file) {
  const name = String(file?.name || "").trim();
  if (name) return name;
  const type = String(file?.type || "").toLowerCase();
  if (type === "image/webp") return "upload.webp";
  if (type === "image/png") return "upload.png";
  if (type === "image/gif") return "upload.gif";
  if (type === "image/jpeg") return "upload.jpg";
  return "upload.jpg";
}
