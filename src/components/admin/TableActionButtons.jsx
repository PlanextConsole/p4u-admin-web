import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";

/** Canonical WowDash action button presets (Banner list reference). */
export const ACTION_PRESETS = {
  view: {
    className: "bg-info-focus bg-hover-info-200 text-info-600",
    icon: "majesticons:eye-line",
    title: "View",
  },
  edit: {
    className: "bg-success-focus bg-hover-success-200 text-success-600",
    icon: "lucide:edit",
    title: "Edit",
  },
  delete: {
    className: "bg-danger-focus bg-hover-danger-200 text-danger-600 remove-item-btn",
    icon: "fluent:delete-24-regular",
    title: "Delete",
  },
  verify: {
    className: "bg-success-focus bg-hover-success-200 text-success-600",
    icon: "mdi:check-circle-outline",
    title: "Verify",
  },
  cancel: {
    className: "bg-danger-focus bg-hover-danger-200 text-danger-600 remove-item-btn",
    icon: "fluent:delete-24-regular",
    title: "Cancel",
  },
};

const SIZE_CLASS = {
  md: "w-40-px h-40-px",
  sm: "w-32-px h-32-px",
};

function actionButtonClass(type, size = "md", extra = "") {
  const preset = ACTION_PRESETS[type] || ACTION_PRESETS.view;
  return [
    preset.className,
    "fw-medium",
    SIZE_CLASS[size] || SIZE_CLASS.md,
    "d-flex justify-content-center align-items-center rounded-circle border-0",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function TableActionButton({
  type = "view",
  onClick,
  href,
  title,
  disabled = false,
  hidden = false,
  icon,
  size = "md",
  className = "",
}) {
  if (hidden) return null;

  const preset = ACTION_PRESETS[type] || ACTION_PRESETS.view;
  const btnClass = actionButtonClass(type, size, className);
  const iconName = icon || preset.icon;
  const label = title || preset.title;
  const iconEl = <Icon icon={iconName} className="icon text-xl" />;

  if (href) {
    return (
      <Link to={href} className={btnClass} title={label} onClick={onClick}>
        {iconEl}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={btnClass} title={label} disabled={disabled}>
      {iconEl}
    </button>
  );
}

/** Standard centered action column header. */
export function TableActionHeader({ className = "", scope = "col" }) {
  return (
    <th scope={scope} className={`text-center ${className}`.trim()}>
      Action
    </th>
  );
}

/** Wrapper for table cells that contain row actions. */
export function TableActionCell({ actions, children, className = "", colSpan, ...rest }) {
  return (
    <td className={`text-center ${className}`.trim()} colSpan={colSpan} {...rest}>
      {children ?? <TableActionButtons actions={actions} />}
    </td>
  );
}

/**
 * Row action buttons — View (blue), Edit (green), Delete (red).
 * @param {{ type: keyof typeof ACTION_PRESETS, onClick?: () => void, href?: string, title?: string, disabled?: boolean, hidden?: boolean, icon?: string, key?: string }[]} actions
 */
export default function TableActionButtons({ actions = [], size = "md", className = "", gap = 10 }) {
  const visible = actions.filter((a) => !a.hidden);
  if (!visible.length) return null;

  return (
    <div className={`d-flex align-items-center justify-content-center gap-${gap} ${className}`.trim()}>
      {visible.map((action, index) => (
        <TableActionButton key={action.key || `${action.type}-${index}`} size={size} {...action} />
      ))}
    </div>
  );
}
