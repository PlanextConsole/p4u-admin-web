import React, { useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const FormModal = ({ onClose, size = "lg", children }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const widths = { sm: 420, md: 640, lg: 880, xl: 1100 };
  const width = widths[size] || widths.lg;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-start justify-content-center"
      style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050, overflowY: "auto", paddingTop: 40, paddingBottom: 40 }}
      onClick={onClose}
    >
      <div
        className="bg-base radius-12 shadow-lg position-relative text-primary-light"
        style={{ width: `min(${width}px, 95vw)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="position-absolute border-0 bg-transparent text-secondary-light"
          style={{ top: 16, right: 16, zIndex: 2 }}
          onClick={onClose}
          aria-label="Close"
        >
          <Icon icon="mdi:close" className="text-2xl" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default FormModal;
