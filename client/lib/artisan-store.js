import { apiRequest, resolveAssetUrl } from "@/lib/api-client";

function mapArtisanAssets(artisan) {
  if (!artisan) return null;
  return {
    ...artisan,
    image: resolveAssetUrl(artisan.image),
  };
}

function mapProductAssets(product) {
  return {
    ...product,
    image: resolveAssetUrl(product.image),
    images: (product.images || []).map((item) => resolveAssetUrl(item)),
  };
}

function mapOrderAssets(order) {
  return {
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      productImage: resolveAssetUrl(item.productImage),
    })),
  };
}

function mapApplicationAssets(application) {
  if (!application) return null;
  return {
    ...application,
  };
}

export async function getMyArtisanApplication() {
  const response = await apiRequest("/auth/artisan-application/me", {
    method: "GET",
    withAuth: true,
  });
  return mapApplicationAssets(response.application);
}

export async function submitArtisanApplication(input) {
  const response = await apiRequest("/auth/artisan-application", {
    method: "POST",
    withAuth: true,
    body: JSON.stringify(input),
  });
  return mapApplicationAssets(response.application);
}

export async function getArtisanDashboardSummary() {
  const response = await apiRequest("/artisan/dashboard", {
    method: "GET",
    withAuth: true,
  });
  return {
    ...response.summary,
    artisan: mapArtisanAssets(response.summary?.artisan),
  };
}

export async function getArtisanProfile() {
  const response = await apiRequest("/artisan/profile", {
    method: "GET",
    withAuth: true,
  });
  return mapArtisanAssets(response.artisan);
}

export async function updateArtisanProfile(input) {
  const response = await apiRequest("/artisan/profile", {
    method: "PATCH",
    withAuth: true,
    body: JSON.stringify(input),
  });
  return mapArtisanAssets(response.artisan);
}

export async function getArtisanProducts() {
  const response = await apiRequest("/artisan/products", {
    method: "GET",
    withAuth: true,
  });
  return response.products.map(mapProductAssets);
}

export async function createArtisanProduct(product) {
  const response = await apiRequest("/artisan/products", {
    method: "POST",
    withAuth: true,
    body: JSON.stringify(product),
  });
  return mapProductAssets(response.product);
}

export async function updateArtisanProduct(productId, product) {
  const response = await apiRequest(`/artisan/products/${productId}`, {
    method: "PUT",
    withAuth: true,
    body: JSON.stringify(product),
  });
  return mapProductAssets(response.product);
}

export async function deleteArtisanProduct(productId) {
  await apiRequest(`/artisan/products/${productId}`, {
    method: "DELETE",
    withAuth: true,
  });
}

export async function getArtisanOrders() {
  const response = await apiRequest("/artisan/orders", {
    method: "GET",
    withAuth: true,
  });
  return response.orders.map(mapOrderAssets);
}

export async function updateArtisanOrderStatus(orderId, status) {
  const response = await apiRequest(`/artisan/orders/${orderId}/status`, {
    method: "PATCH",
    withAuth: true,
    body: JSON.stringify({ status }),
  });
  return mapOrderAssets(response.order);
}

export async function getAdminArtisanApplications(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiRequest(`/admin/artisan-applications${query}`, {
    method: "GET",
    withAuth: true,
  });
  return (response.applications || []).map(mapApplicationAssets);
}

export async function approveAdminArtisanApplication(applicationId) {
  const response = await apiRequest(`/admin/artisan-applications/${applicationId}/approve`, {
    method: "PATCH",
    withAuth: true,
  });
  return mapApplicationAssets(response.application);
}

export async function rejectAdminArtisanApplication(applicationId, reason) {
  const response = await apiRequest(`/admin/artisan-applications/${applicationId}/reject`, {
    method: "PATCH",
    withAuth: true,
    body: JSON.stringify({ reason }),
  });
  return mapApplicationAssets(response.application);
}
