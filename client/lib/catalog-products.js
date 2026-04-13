import { apiRequest, resolveAssetUrl } from "@/lib/api-client";
import {} from "@/lib/data";
function mapProductAssets(product) {
    return {
        ...product,
        image: resolveAssetUrl(product.image),
        images: (product.images || []).map((item) => resolveAssetUrl(item)),
    };
}
export async function getCatalogProducts(params) {
    const queryParams = new URLSearchParams();
    if (params?.search)
        queryParams.set("search", params.search);
    if (params?.categoryId)
        queryParams.set("categoryId", params.categoryId);
    if (params?.districtId)
        queryParams.set("districtId", params.districtId);
    if (params?.artisanId)
        queryParams.set("artisanId", params.artisanId);
    const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const response = await apiRequest(`/catalog/products${suffix}`, {
        method: "GET",
    });
    return response.products.map(mapProductAssets);
}
export async function getCatalogProductById(productId) {
    try {
        const response = await apiRequest(`/catalog/products/${productId}`, {
            method: "GET",
        });
        return mapProductAssets(response.product);
    }
    catch {
        return undefined;
    }
}
