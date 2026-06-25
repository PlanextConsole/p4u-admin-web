/** File input accept list — includes WebP and common mobile formats. */
export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,image/avif,image/heic,image/heif,image/bmp,image/svg+xml,image/*,.webp,.jpg,.jpeg,.png,.gif,.avif,.heic,.heif";

export const IMAGE_OR_VIDEO_ACCEPT = `${IMAGE_ACCEPT},video/mp4,video/webm,video/quicktime,video/*`;

export const IMAGE_OR_PDF_ACCEPT = `${IMAGE_ACCEPT},application/pdf,.pdf`;
