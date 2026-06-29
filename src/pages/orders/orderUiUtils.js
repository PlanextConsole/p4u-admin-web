export function parseMeta(m) {
  if (m == null) return {};
  if (typeof m === "string") {
    try { return JSON.parse(m) || {}; } catch { return {}; }
  }
  return typeof m === "object" && !Array.isArray(m) ? m : {};
}

export function displayRef(prefix, id, metaKey, meta) {
  const fromMeta = meta?.[metaKey];
  if (fromMeta && String(fromMeta).trim()) return String(fromMeta).trim();
  if (!id) return "—";
  const hex = String(id).replace(/-/g, "");
  const n = parseInt(hex.slice(0, 8), 16) % 10000000;
  return `${prefix}${String(n).padStart(7, "0")}`;
}

export function formatTs(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatMoney(n) {
  const x = Number(n) || 0;
  return `₹${x.toLocaleString("en-IN", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

export function orderItemsLabel(meta) {
  const lines = meta.lines ?? meta.items ?? meta.lineItems ?? meta.orderItems;
  if (!Array.isArray(lines) || lines.length === 0) return "—";
  const names = lines
    .map((row) => row.name || row.productName || row.title || row.serviceName || "")
    .filter(Boolean);
  if (!names.length) return String(lines.length);
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
}

export function productStatusPill(status) {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "delivered") return { cls: "p4u-order-pill is-completed", label: "Completed" };
  if (s === "cancelled" || s === "canceled") return { cls: "p4u-order-pill is-cancelled", label: "Cancelled" };
  if (s === "placed" || s === "pending" || s === "created") return { cls: "p4u-order-pill is-placed", label: "Placed" };
  if (s === "paid") return { cls: "p4u-order-pill is-paid", label: "Paid" };
  if (s === "accepted") return { cls: "p4u-order-pill is-accepted", label: "Accepted" };
  if (s === "in_progress") return { cls: "p4u-order-pill is-progress", label: "In Progress" };
  return {
    cls: "p4u-order-pill is-placed",
    label: (status || "Placed").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export function serviceStatusPill(status) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return { cls: "p4u-order-pill is-completed", label: "Delivered" };
  if (s === "cancelled" || s === "rejected") return { cls: "p4u-order-pill is-cancelled", label: "Cancelled" };
  if (s === "pending") return { cls: "p4u-order-pill is-placed", label: "Placed" };
  if (s === "approved") return { cls: "p4u-order-pill is-accepted", label: "Accepted" };
  if (s === "in_progress") return { cls: "p4u-order-pill is-progress", label: "In Progress" };
  return { cls: "p4u-order-pill is-placed", label: (status || "—").replace(/_/g, " ") };
}
