import { apiRequest, resolveAssetUrl } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";
import {} from "@/lib/data";
export const ORDER_STATUSES = [
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled",
];
function mapProductAssets(product) {
    return {
        ...product,
        image: resolveAssetUrl(product.image),
        images: (product.images || []).map((item) => resolveAssetUrl(item)),
    };
}
function mapArtisanAssets(artisan) {
    return {
        ...artisan,
        image: resolveAssetUrl(artisan.image),
    };
}
function mapCategoryAssets(category) {
    return {
        ...category,
        image: resolveAssetUrl(category.image),
    };
}
function mapDistrictAssets(district) {
    return {
        ...district,
        image: resolveAssetUrl(district.image),
    };
}
export function getCurrentUser() {
    return getStoredUser();
}
export function isAdminUser(user) {
    return user?.role === "admin";
}
export async function getAdminProducts() {
    const response = await apiRequest("/admin/products", {
        method: "GET",
        withAuth: true,
    });
    return response.products.map(mapProductAssets);
}
export async function createAdminProduct(product) {
    const response = await apiRequest("/admin/products", {
        method: "POST",
        withAuth: true,
        body: JSON.stringify(product),
    });
    return mapProductAssets(response.product);
}
export async function updateAdminProduct(productId, product) {
    const response = await apiRequest(`/admin/products/${productId}`, {
        method: "PUT",
        withAuth: true,
        body: JSON.stringify(product),
    });
    return mapProductAssets(response.product);
}
export async function deleteAdminProduct(productId) {
    await apiRequest(`/admin/products/${productId}`, {
        method: "DELETE",
        withAuth: true,
    });
}
export async function saveAdminProducts(products) {
    const current = await getAdminProducts();
    const currentMap = new Map(current.map((item) => [item.id, item]));
    const nextMap = new Map(products.map((item) => [item.id, item]));
    for (const product of products) {
        if (currentMap.has(product.id)) {
            await updateAdminProduct(product.id, product);
        }
        else {
            await createAdminProduct(product);
        }
    }
    for (const existing of current) {
        if (!nextMap.has(existing.id)) {
            await deleteAdminProduct(existing.id);
        }
    }
}
export async function getAdminOrders() {
    const response = await apiRequest("/admin/orders", {
        method: "GET",
        withAuth: true,
    });
    return response.orders;
}
export async function saveAdminOrders(_orders) {
    // Orders are managed through status updates in this implementation.
}
export async function updateAdminOrderStatus(orderId, status) {
    await apiRequest(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        withAuth: true,
        body: JSON.stringify({ status }),
    });
    return getAdminOrders();
}
export async function getAdminArtisans() {
    const response = await apiRequest("/admin/artisans", {
        method: "GET",
        withAuth: true,
    });
    return response.artisans.map(mapArtisanAssets);
}
export async function createAdminArtisan(artisan) {
    const response = await apiRequest("/admin/artisans", {
        method: "POST",
        withAuth: true,
        body: JSON.stringify(artisan),
    });
    return mapArtisanAssets(response.artisan);
}
export async function updateAdminArtisan(artisanId, artisan) {
    const response = await apiRequest(`/admin/artisans/${artisanId}`, {
        method: "PUT",
        withAuth: true,
        body: JSON.stringify(artisan),
    });
    return mapArtisanAssets(response.artisan);
}
export async function deleteAdminArtisan(artisanId) {
    await apiRequest(`/admin/artisans/${artisanId}`, {
        method: "DELETE",
        withAuth: true,
    });
}
export async function saveAdminArtisans(artisans) {
    const current = await getAdminArtisans();
    const currentMap = new Map(current.map((item) => [item.id, item]));
    const nextMap = new Map(artisans.map((item) => [item.id, item]));
    for (const artisan of artisans) {
        if (currentMap.has(artisan.id)) {
            await updateAdminArtisan(artisan.id, artisan);
        }
        else {
            await createAdminArtisan(artisan);
        }
    }
    for (const existing of current) {
        if (!nextMap.has(existing.id)) {
            await deleteAdminArtisan(existing.id);
        }
    }
}
export async function getAdminCategories() {
    const response = await apiRequest("/admin/categories", {
        method: "GET",
        withAuth: true,
    });
    return response.categories.map(mapCategoryAssets);
}
export async function createAdminCategory(category) {
    const response = await apiRequest("/admin/categories", {
        method: "POST",
        withAuth: true,
        body: JSON.stringify(category),
    });
    return mapCategoryAssets(response.category);
}
export async function updateAdminCategory(categoryId, category) {
    const response = await apiRequest(`/admin/categories/${categoryId}`, {
        method: "PUT",
        withAuth: true,
        body: JSON.stringify(category),
    });
    return mapCategoryAssets(response.category);
}
export async function deleteAdminCategory(categoryId) {
    await apiRequest(`/admin/categories/${categoryId}`, {
        method: "DELETE",
        withAuth: true,
    });
}
export async function saveAdminCategories(categories) {
    const current = await getAdminCategories();
    const currentMap = new Map(current.map((item) => [item.id, item]));
    const nextMap = new Map(categories.map((item) => [item.id, item]));
    for (const category of categories) {
        if (currentMap.has(category.id)) {
            await updateAdminCategory(category.id, category);
        }
        else {
            await createAdminCategory(category);
        }
    }
    for (const existing of current) {
        if (!nextMap.has(existing.id)) {
            await deleteAdminCategory(existing.id);
        }
    }
}
export async function getAdminDistricts() {
    const response = await apiRequest("/admin/districts", {
        method: "GET",
        withAuth: true,
    });
    return response.districts.map(mapDistrictAssets);
}
export async function createAdminDistrict(district) {
    const response = await apiRequest("/admin/districts", {
        method: "POST",
        withAuth: true,
        body: JSON.stringify(district),
    });
    return mapDistrictAssets(response.district);
}
export async function updateAdminDistrict(districtId, district) {
    const response = await apiRequest(`/admin/districts/${districtId}`, {
        method: "PUT",
        withAuth: true,
        body: JSON.stringify(district),
    });
    return mapDistrictAssets(response.district);
}
export async function deleteAdminDistrict(districtId) {
    await apiRequest(`/admin/districts/${districtId}`, {
        method: "DELETE",
        withAuth: true,
    });
}
export async function saveAdminDistricts(districts) {
    const current = await getAdminDistricts();
    const currentMap = new Map(current.map((item) => [item.id, item]));
    const nextMap = new Map(districts.map((item) => [item.id, item]));
    for (const district of districts) {
        if (currentMap.has(district.id)) {
            await updateAdminDistrict(district.id, district);
        }
        else {
            await createAdminDistrict(district);
        }
    }
    for (const existing of current) {
        if (!nextMap.has(existing.id)) {
            await deleteAdminDistrict(existing.id);
        }
    }
}
export async function getAdminSettings() {
    const response = await apiRequest("/admin/settings", {
        method: "GET",
        withAuth: true,
    });
    return response.settings;
}
export async function saveAdminSettings(settings) {
    await apiRequest("/admin/settings", {
        method: "PUT",
        withAuth: true,
        body: JSON.stringify(settings),
    });
}
export function getMonthlyRevenueData(orders, monthCount = 6) {
    const now = new Date();
    const months = Array.from({ length: monthCount }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - index), 1);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        return {
            key,
            name: date.toLocaleString("en-US", { month: "short" }),
            revenue: 0,
            orders: 0,
        };
    });
    const monthMap = new Map(months.map((month) => [month.key, month]));
    orders.forEach((order) => {
        const date = new Date(order.createdAt);
        if (Number.isNaN(date.getTime()))
            return;
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const bucket = monthMap.get(key);
        if (!bucket)
            return;
        bucket.revenue += order.total;
        bucket.orders += 1;
    });
    return months.map(({ name, revenue, orders: orderCount }) => ({
        name,
        revenue,
        orders: orderCount,
    }));
}
export function getProductSalesMap(orders) {
    const sales = {};
    orders.forEach((order) => {
        order.items.forEach((item) => {
            sales[item.productId] = (sales[item.productId] ?? 0) + item.quantity;
        });
    });
    return sales;
}
