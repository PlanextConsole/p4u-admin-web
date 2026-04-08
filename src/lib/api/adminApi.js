import { api, ApiError, ensureTokenFresh } from "./client";
import { buildApiUrl } from "./config";
import { getAccessToken } from "./tokenStorage";

/** @param {{ username: string, password: string }} body */
export function loginPublic(body) {
  return api.post("/api/auth/public/login", body, { skipAuth: true });
}

/** Upload a single file and return { url, filename, originalName, size } */
export async function uploadFile(file) {
  if (!file || !(file instanceof Blob)) {
    throw new ApiError(400, "No file to upload", {});
  }
  try {
    await ensureTokenFresh();
  } catch {
    /* same as apiRequest: proceed; 401 handled below */
  }
  const formData = new FormData();
  formData.append("file", file, file.name);
  const url = buildApiUrl("/api/admin/upload");
  const headers = {};
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // Do NOT set Content-Type - browser auto-sets multipart/form-data with boundary
  const res = await fetch(url, { method: "POST", headers, body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.message || "Upload failed", data);
  }
  return res.json();
}

export function fetchAdminMetadata() {
  return api.get("/api/admin/metadata/all/null");
}

export function listVendors(params) {
  return api.get("/api/admin/vendors", params);
}

export function getVendor(id) {
  return api.get(`/api/admin/vendors/${encodeURIComponent(id)}`);
}

export function createVendor(body) {
  return api.post("/api/admin/vendors", body);
}

export function updateVendor(id, body) {
  return api.patch(`/api/admin/vendors/${encodeURIComponent(id)}`, body);
}

export function deleteVendor(id) {
  return api.delete(`/api/admin/vendors/${encodeURIComponent(id)}`);
}

export function listCustomers(params) {
  return api.get("/api/admin/customers", params);
}

export function getCustomer(id) {
  return api.get(`/api/admin/customers/${encodeURIComponent(id)}`);
}

export function createCustomer(body) {
  return api.post("/api/admin/customers", body);
}

export function updateCustomer(id, body) {
  return api.patch(`/api/admin/customers/${encodeURIComponent(id)}`, body);
}

export function deleteCustomer(id) {
  return api.delete(`/api/admin/customers/${encodeURIComponent(id)}`);
}

export function listOccupations(params) {
  return api.get("/api/admin/occupations", params);
}

export function listProducts(params) {
  return api.get("/api/admin/products", params);
}

export function getProduct(id) {
  return api.get(`/api/admin/products/${encodeURIComponent(id)}`);
}

export function createProduct(body) {
  return api.post("/api/admin/products", body);
}

export function updateProduct(id, body) {
  return api.patch(`/api/admin/products/${encodeURIComponent(id)}`, body);
}

export function deleteProduct(id) {
  return api.delete(`/api/admin/products/${encodeURIComponent(id)}`);
}

export function listTaxConfigurations(params) {
  return api.get("/api/admin/taxconfiguration", params);
}

export function listCategories(params) {
  return api.get("/api/admin/categories", params);
}

export function getCategory(id) {
  return api.get(`/api/admin/categories/${encodeURIComponent(id)}`);
}

export function createCategory(body) {
  return api.post("/api/admin/categories", body);
}

export function updateCategory(id, body) {
  return api.patch(`/api/admin/categories/${encodeURIComponent(id)}`, body);
}

export function deleteCategory(id) {
  return api.delete(`/api/admin/categories/${encodeURIComponent(id)}`);
}

export function listCatalogServices(params) {
  return api.get("/api/admin/services", params);
}

export function getCatalogService(id) {
  return api.get(`/api/admin/services/${encodeURIComponent(id)}`);
}

export function createCatalogService(body) {
  return api.post("/api/admin/services", body);
}

export function updateCatalogService(id, body) {
  return api.patch(`/api/admin/services/${encodeURIComponent(id)}`, body);
}

export function deleteCatalogService(id) {
  return api.delete(`/api/admin/services/${encodeURIComponent(id)}`);
}

export function listOrders(params) {
  return api.get("/api/admin/orders", params);
}

export function getOrder(id) {
  return api.get(`/api/admin/orders/individual/${encodeURIComponent(id)}`);
}

export function updateOrder(id, body) {
  return api.patch(`/api/admin/orders/individual/${encodeURIComponent(id)}`, body);
}

export function listCoupons(params) {
  return api.get("/api/admin/coupons", params);
}

export function createCoupon(body) {
  return api.post("/api/admin/coupons", body);
}

export function updateCoupon(id, body) {
  return api.patch(`/api/admin/coupons/${encodeURIComponent(id)}`, body);
}

export function deleteCoupon(id) {
  return api.delete(`/api/admin/coupons/${encodeURIComponent(id)}`);
}

/** No GET /coupons/:id; locate by paging list (max limit 200 on server). */
export async function fetchCouponById(id) {
  const limit = 200;
  let offset = 0;
  for (let p = 0; p < 25; p++) {
    const res = await listCoupons({ limit, offset });
    const items = res.items || [];
    const row = items.find((c) => c.id === id);
    if (row) return row;
    const total = typeof res.total === "number" ? res.total : 0;
    offset += items.length;
    if (items.length === 0 || offset >= total) break;
  }
  return null;
}

export function getOccupation(id) {
  return api.get(`/api/admin/occupations/${encodeURIComponent(id)}`);
}

export function createOccupation(body) {
  return api.post("/api/admin/occupations", body);
}

export function updateOccupation(id, body) {
  return api.patch(`/api/admin/occupations/${encodeURIComponent(id)}`, body);
}

export function deleteOccupation(id) {
  return api.delete(`/api/admin/occupations/${encodeURIComponent(id)}`);
}

export function listVendorEnquiries(params) {
  return api.get("/api/admin/vendor-enquiries", params);
}

export function getVendorEnquiry(id) {
  return api.get(`/api/admin/vendor-enquiries/${encodeURIComponent(id)}`);
}

export function updateVendorEnquiry(id, body) {
  return api.patch(`/api/admin/vendor-enquiries/${encodeURIComponent(id)}`, body);
}

export function listVendorRequests(params) {
  return api.get("/api/admin/vendor-requests", params);
}

export function deleteVendorRequest(id) {
  return api.delete(`/api/admin/vendor-requests/${encodeURIComponent(id)}`);
}

export function listPlatformVariables(params) {
  return api.get("/api/admin/platformVariables", params);
}

export function createPlatformVariable(body) {
  return api.post("/api/admin/platformVariables", body);
}

export function updatePlatformVariable(id, body) {
  return api.patch(`/api/admin/platformVariables/${encodeURIComponent(id)}`, body);
}

export function deletePlatformVariable(id) {
  return api.delete(`/api/admin/platformVariables/${encodeURIComponent(id)}`);
}

/** Point-style settlements from commerce (settlementType points). */
export function listPointsSettlements(params) {
  return api.get("/api/admin/Settlements/allPoints/null", params);
}
