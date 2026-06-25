import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import MediaLibraryPicker from "./MediaLibraryPicker";
import { IMAGE_ACCEPT } from "../../lib/acceptImages";

/**
 * Image field with direct upload + media library picker.
 * @param {{
 *   disabled?: boolean,
 *   accept?: string,
 *   onFileSelect?: (file: File) => void,
 *   onLibrarySelect?: (url: string) => void,
 *   showLibrary?: boolean,
 *   libraryTitle?: string,
 *   className?: string,
 * }} props
 */
export default function ImageUploadField({
  disabled = false,
  accept = IMAGE_ACCEPT,
  onFileSelect,
  onLibrarySelect,
  showLibrary = true,
  libraryTitle,
  className = "form-control radius-10",
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-8">
        <input
          type="file"
          className={className}
          accept={accept}
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && onFileSelect) onFileSelect(f);
            e.target.value = "";
          }}
        />
        {showLibrary && onLibrarySelect ? (
          <button
            type="button"
            className="btn btn-outline-primary radius-10 text-nowrap"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            <Icon icon="mdi:folder-image" className="me-6" />
            Media Library
          </button>
        ) : null}
      </div>
      {showLibrary && onLibrarySelect ? (
        <MediaLibraryPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={onLibrarySelect}
          title={libraryTitle}
        />
      ) : null}
    </>
  );
}
