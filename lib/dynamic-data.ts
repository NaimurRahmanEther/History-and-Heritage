import {
  artisans as seedArtisans,
  categories as seedCategories,
  districts as seedDistricts,
  type Artisan,
  type Category,
  type District,
  type Product,
} from "@/lib/data";
import {
  getAdminArtisans,
  getAdminCategories,
  getAdminDistricts,
} from "@/lib/admin-store";
import { getCatalogProducts } from "@/lib/catalog-products";

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

function buildProductCountMap(
  products: Product[],
  key: "categoryId" | "districtId" | "artisanId"
): Map<string, number> {
  const counts = new Map<string, number>();
  products.forEach((product) => {
    const value = product[key];
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return counts;
}

export function getDynamicProducts(): Product[] {
  return getCatalogProducts();
}

export function getDynamicCategories(): Category[] {
  const catalogProducts = getCatalogProducts();
  const adminCategories = getAdminCategories().filter((category) => category.active);
  const sourceCategories = adminCategories.length > 0 ? adminCategories : seedCategories;
  const productCountByCategory = buildProductCountMap(catalogProducts, "categoryId");

  return dedupeById(
    sourceCategories.map((category) => ({
      id: category.id,
      name: category.name,
      image: category.image,
      description: category.description,
      productCount: productCountByCategory.get(category.id) ?? 0,
    }))
  );
}

export function getDynamicDistricts(): District[] {
  const catalogProducts = getCatalogProducts();
  const adminDistricts = getAdminDistricts().filter((district) => district.active);
  const sourceDistricts = adminDistricts.length > 0 ? adminDistricts : seedDistricts;
  const productCountByDistrict = buildProductCountMap(catalogProducts, "districtId");

  return dedupeById(
    sourceDistricts.map((district) => ({
      id: district.id,
      name: district.name,
      division: district.division,
      image: district.image,
      description: district.description,
      productCount: productCountByDistrict.get(district.id) ?? 0,
    }))
  );
}

export function getDynamicArtisans(): Artisan[] {
  const catalogProducts = getCatalogProducts();
  const adminArtisans = getAdminArtisans().filter((artisan) => artisan.active);
  const sourceArtisans = adminArtisans.length > 0 ? adminArtisans : seedArtisans;
  const productCountByArtisan = buildProductCountMap(catalogProducts, "artisanId");

  return dedupeById(
    sourceArtisans.map((artisan) => ({
      id: artisan.id,
      name: artisan.name,
      image: artisan.image,
      district: artisan.district,
      districtId: artisan.districtId,
      specialty: artisan.specialty,
      bio: artisan.bio,
      story: artisan.story,
      yearsOfExperience: artisan.yearsOfExperience,
      productCount: productCountByArtisan.get(artisan.id) ?? 0,
    }))
  );
}

export function getDynamicProductById(productId: string): Product | undefined {
  return getCatalogProducts().find((product) => product.id === productId);
}

export function getDynamicCategoryById(categoryId: string): Category | undefined {
  return getDynamicCategories().find((category) => category.id === categoryId);
}

export function getDynamicDistrictById(districtId: string): District | undefined {
  return getDynamicDistricts().find((district) => district.id === districtId);
}

export function getDynamicArtisanById(artisanId: string): Artisan | undefined {
  return getDynamicArtisans().find((artisan) => artisan.id === artisanId);
}

export function getDynamicProductsByCategory(categoryId: string): Product[] {
  return getCatalogProducts().filter((product) => product.categoryId === categoryId);
}

export function getDynamicProductsByDistrict(districtId: string): Product[] {
  return getCatalogProducts().filter((product) => product.districtId === districtId);
}

export function getDynamicProductsByArtisan(artisanId: string): Product[] {
  return getCatalogProducts().filter((product) => product.artisanId === artisanId);
}
