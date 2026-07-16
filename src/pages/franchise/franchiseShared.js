export const PAGE_SIZE = 20;

export const formatInr = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};

export const statusBadge = (status) => {
  const value = String(status || "pending").toLowerCase();
  if (["active", "approved", "success", "paid"].includes(value)) return "bg-success-focus text-success-600";
  if (["rejected", "failed", "terminated", "refunded"].includes(value)) return "bg-danger-focus text-danger-600";
  if (["under_review", "submitted", "suspended"].includes(value)) return "bg-info-focus text-info-600";
  return "bg-warning-focus text-warning-600";
};

export function exportCsv(filename, headers, rows) {
  const escape = (value) => {
    const string = value == null ? "" : String(value);
    return /[",\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
