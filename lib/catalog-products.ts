import { products as seedProducts, type Product } from "@/lib/data";
import {
  getAdminArtisans,
  getAdminCategories,
  getAdminDistricts,
} from "@/lib/admin-store";

interface StoredAdminProduct {
  id?: string;
  name?: string;
  price?: number | string;
  originalPrice?: number | string;
  category?: string;
  district?: string;
  artisan?: string;
  description?: string;
  craftProcess?: string;
  culturalSignificance?: string;
  image?: string;
  images?: string[];
  inStock?: boolean;
  rating?: number | string;
  reviewCount?: number | string;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function toSlug(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toNumber(value: number | string | undefined, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveCategory(
  rawCategory: string,
  categories: Array<{ id: string; name: string }>
): { categoryId: string; category: string } {
  const normalizedCategory = normalizeText(rawCategory);
  const matchedCategory = categories.find(
    (category) =>
      normalizeText(category.id) === normalizedCategory ||
      normalizeText(category.name) === normalizedCategory
  );

  if (matchedCategory) {
    return {
      categoryId: matchedCategory.id,
      category: matchedCategory.name,
    };
  }

  return {
    categoryId: toSlug(rawCategory || "custom-category"),
    category: rawCategory.trim() || "Custom Category",
  };
}

function resolveDistrict(
  rawDistrict: string,
  districts: Array<{ id: string; name: string }>
): { districtId: string; district: string } {
  const normalizedDistrict = normalizeText(rawDistrict);
  const matchedDistrict = districts.find(
    (district) =>
      normalizeText(district.id) === normalizedDistrict ||
      normalizeText(district.name) === normalizedDistrict
  );

  if (matchedDistrict) {
    return {
      districtId: matchedDistrict.id,
      district: matchedDistrict.name,
    };
  }

  return {
    districtId: toSlug(rawDistrict || "unknown-district"),
    district: rawDistrict.trim() || "Unknown District",
  };
}

function resolveArtisanId(
  rawArtisan: string,
  artisans: Array<{ id: string; name: string }>
): string {
  const normalizedArtisan = normalizeText(rawArtisan);
  const matchedArtisan = artisans.find(
    (artisan) =>
      normalizeText(artisan.id) === normalizedArtisan ||
      normalizeText(artisan.name) === normalizedArtisan
  );

  return matchedArtisan?.id ?? "";
}

function mapStoredAdminProduct(
  product: StoredAdminProduct,
  index: number,
  lookup: {
    categories: Array<{ id: string; name: string }>;
    districts: Array<{ id: string; name: string }>;
    artisans: Array<{ id: string; name: string }>;
  }
): Product | null {
  const productName = typeof product.name === "string" ? product.name.trim() : "";
  if (!productName) {
    return null;
  }

  const productId =
    typeof product.id === "string" && product.id.trim()
      ? product.id
      : `admin-product-${index}`;

  const price = toNumber(product.price, 0);
  if (price <= 0) {
    return null;
  }

  const originalPrice = toNumber(product.originalPrice, price);
  const primaryImage =
    typeof product.image === "string" && product.image.trim()
      ? product.image
      : "https://images.unsplash.com/photo-1505252585461-04db1267ae0e?w=500&q=80";

  const galleryImages = Array.isArray(product.images)
    ? product.images.filter(
        (image): image is string => typeof image === "string" && image.trim().length > 0
      )
    : [];

  const { categoryId, category } = resolveCategory(product.category ?? "", lookup.categories);
  const { districtId, district } = resolveDistrict(product.district ?? "", lookup.districts);
  const rating = Math.max(0, Math.min(5, toNumber(product.rating, 4.5)));

  return {
    id: productId,
    name: productName,
    price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    image: primaryImage,
    images: galleryImages.length > 0 ? galleryImages : [primaryImage],
    district,
    districtId,
    category,
    categoryId,
    rating,
    reviewCount: Math.max(0, Math.floor(toNumber(product.reviewCount, 0))),
    description:
      typeof product.description === "string" && product.description.trim().length > 0
        ? product.description
        : "Handmade product from our admin catalog.",
    artisanId: resolveArtisanId(product.artisan ?? "", lookup.artisans),
    inStock: typeof product.inStock === "boolean" ? product.inStock : true,
    craftProcess:
      typeof product.craftProcess === "string" && product.craftProcess.trim().length > 0
        ? product.craftProcess
        : undefined,
    culturalSignificance:
      typeof product.culturalSignificance === "string" &&
      product.culturalSignificance.trim().length > 0
        ? product.culturalSignificance
        : undefined,
  };
}

export function getCatalogProducts(): Product[] {
  if (typeof window === "undefined") {
    return seedProducts;
  }

  const rawAdminProducts = window.localStorage.getItem("adminProducts");
  if (!rawAdminProducts) {
    return seedProducts;
  }

  let parsedAdminProducts: unknown;
  try {
    parsedAdminProducts = JSON.parse(rawAdminProducts);
  } catch {
    return seedProducts;
  }

  if (!Array.isArray(parsedAdminProducts)) {
    return seedProducts;
  }

  const lookup = {
    categories: getAdminCategories(),
    districts: getAdminDistricts(),
    artisans: getAdminArtisans(),
  };

  const mappedAdminProducts = parsedAdminProducts
    .map((item, index) =>
      mapStoredAdminProduct(item as StoredAdminProduct, index, lookup)
    )
    .filter((item): item is Product => item !== null);

  const deduped = new Map<string, Product>();
  mappedAdminProducts.forEach((product) => {
    deduped.set(product.id, product);
  });

  return Array.from(deduped.values());
}

export function getCatalogProductById(productId: string): Product | undefined {
  return getCatalogProducts().find((product) => product.id === productId);
}
