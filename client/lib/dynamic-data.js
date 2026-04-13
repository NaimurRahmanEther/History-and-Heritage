import { apiRequest, resolveAssetUrl } from "@/lib/api-client";
import {} from "@/lib/data";
import { getCatalogProducts } from "@/lib/catalog-products";
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
function mapArtisanAssets(artisan) {
    return {
        ...artisan,
        image: resolveAssetUrl(artisan.image),
    };
}
export async function getDynamicProducts() {
    return getCatalogProducts();
}
export async function getDynamicCategories() {
    const response = await apiRequest("/catalog/categories", {
        method: "GET",
    });
    return response.categories.map(mapCategoryAssets);
}
export async function getDynamicDistricts() {
    const response = await apiRequest("/catalog/districts", {
        method: "GET",
    });
    return response.districts.map(mapDistrictAssets);
}
export async function getDynamicArtisans() {
    const response = await apiRequest("/catalog/artisans", {
        method: "GET",
    });
    return response.artisans.map(mapArtisanAssets);
}
export async function getDynamicProductById(productId) {
    const products = await getDynamicProducts();
    return products.find((product) => product.id === productId);
}
export async function getDynamicCategoryById(categoryId) {
    try {
        const response = await apiRequest(`/catalog/categories/${categoryId}`, {
            method: "GET",
        });
        return mapCategoryAssets(response.category);
    }
    catch {
        return undefined;
    }
}
export async function getDynamicDistrictById(districtId) {
    try {
        const response = await apiRequest(`/catalog/districts/${districtId}`, {
            method: "GET",
        });
        return mapDistrictAssets(response.district);
    }
    catch {
        return undefined;
    }
}
export async function getDynamicArtisanById(artisanId) {
    try {
        const response = await apiRequest(`/catalog/artisans/${artisanId}`, {
            method: "GET",
        });
        return mapArtisanAssets(response.artisan);
    }
    catch {
        return undefined;
    }
}
export async function getDynamicProductsByCategory(categoryId) {
    return getCatalogProducts({ categoryId });
}
export async function getDynamicProductsByDistrict(districtId) {
    return getCatalogProducts({ districtId });
}
export async function getDynamicProductsByArtisan(artisanId) {
    return getCatalogProducts({ artisanId });
}
