const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const STATE_CODE_RE = /^[0-9]{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function phoneDigits(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function inPercentRange(value) {
  if (value == null || value === "") return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

/**
 * @param {Record<string, unknown>} form
 * @returns {{ valid: boolean, errors: Record<string, string>, firstMessage: string | null }}
 */
export function validateVendorForm(form) {
  /** @type {Record<string, string>} */
  const errors = {};

  const ownerName = String(form.ownerName || "").trim();
  const businessName = String(form.businessName || "").trim();
  const email = String(form.email || "").trim();
  const phone = String(form.phone || "").trim();
  const gst = String(form.gst || "").trim().toUpperCase();
  const pan = String(form.pan || "").trim().toUpperCase();
  const ifsc = String(form.ifscCode || "").trim().toUpperCase();
  const stateCode = String(form.stateCode || "").trim();
  const vendorKind = form.vendorKind === "service" ? "service" : "product";

  if (!ownerName) errors.ownerName = "Owner name is required";
  if (!businessName) errors.businessName = "Business name is required";
  if (vendorKind !== "product" && vendorKind !== "service") {
    errors.vendorKind = "Vendor type is required";
  }

  if (!email) errors.email = "Email is required";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";

  if (!phone) errors.phone = "Mobile number is required";
  else if (!/^[6-9]\d{9}$/.test(phoneDigits(phone))) {
    errors.phone = "Enter a valid 10-digit Indian mobile number";
  }

  if (gst && (gst.length !== 15 || !GSTIN_RE.test(gst))) {
    errors.gst = "GSTIN must be 15 characters in valid format";
  }
  if (pan && (pan.length !== 10 || !PAN_RE.test(pan))) {
    errors.pan = "PAN must be 10 characters (e.g. ABCDE1234F)";
  }
  if (ifsc && !IFSC_RE.test(ifsc)) {
    errors.ifscCode = "Enter a valid IFSC code";
  }
  if (stateCode && !STATE_CODE_RE.test(stateCode)) {
    errors.stateCode = "State code must be 2 digits";
  }
  if (!inPercentRange(form.commissionRate)) {
    errors.commissionRate = "Commission must be between 0 and 100";
  }
  if (!inPercentRange(form.maxRedemptionPercent)) {
    errors.maxRedemptionPercent = "Max redemption must be between 0 and 100";
  }

  if (
    vendorKind === "service" &&
    (!Array.isArray(form.selectedServiceIds) || !form.selectedServiceIds.length)
  ) {
    errors.selectedServiceIds = "Select at least one service";
  }

  const keys = Object.keys(errors);
  return {
    valid: keys.length === 0,
    errors,
    firstMessage: keys.length ? errors[keys[0]] : null,
  };
}
