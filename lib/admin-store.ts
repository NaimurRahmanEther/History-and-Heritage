import {
  artisans as seedArtisans,
  categories as seedCategories,
  districts as seedDistricts,
  products as seedProducts,
  type Artisan,
  type Category,
  type District,
} from "@/lib/data";

const STORAGE_KEYS = {
  user: "user",
  products: "adminProducts",
  orders: "orders",
  artisans: "adminArtisans",
  categories: "adminCategories",
  districts: "adminDistricts",
  settings: "adminSettings",
} as const;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function readRaw(key: string): string | null {
  if (!hasWindow()) {
    return null;
  }
  return window.localStorage.getItem(key);
}

function writeRaw(key: string, value: string): void {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(key, value);
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  category: string;
  district: string;
  artisan: string;
  description: string;
  craftProcess: string;
  culturalSignificance: string;
  image: string;
  images?: string[];
  inStock: boolean;
  createdAt: string;
}

export type AdminOrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export const ORDER_STATUSES: AdminOrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

export interface AdminOrderItem {
  productId: string;
  quantity: number;
}

export interface AdminOrder {
  id: string;
  userId: string;
  items: AdminOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: AdminOrderStatus;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
  };
  createdAt: string;
}

export interface AdminArtisan extends Artisan {
  active: boolean;
  createdAt: string;
}

export interface AdminCategory extends Category {
  active: boolean;
  createdAt: string;
}

export interface AdminDistrict extends District {
  active: boolean;
  createdAt: string;
}

export interface AdminSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currencySymbol: string;
  shippingFee: number;
  freeShippingThreshold: number;
  lowStockThreshold: number;
  maintenanceMode: boolean;
  updatedAt: string;
}

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  storeName: "Bangladesh Heritage",
  storeEmail: "admin@heritage.com",
  storePhone: "+880 1700 000000",
  storeAddress: "Dhaka, Bangladesh",
  currencySymbol: "BDT",
  shippingFee: 200,
  freeShippingThreshold: 5000,
  lowStockThreshold: 5,
  maintenanceMode: false,
  updatedAt: new Date().toISOString(),
};

function normalizeOrderStatus(status: string): AdminOrderStatus {
  const lowered = status.toLowerCase();
  if (ORDER_STATUSES.includes(lowered as AdminOrderStatus)) {
    return lowered as AdminOrderStatus;
  }
  return "pending";
}

function normalizeAdminProduct(value: unknown, index: number): AdminProduct | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = asString(value.name).trim();
  const id = asString(value.id, `prod-${index + 1}`).trim();
  if (!name || !id) {
    return null;
  }

  const price = asNumber(value.price, 0);
  const originalPrice = asNumber(value.originalPrice, price);
  if (price <= 0) {
    return null;
  }

  const image = asString(value.image).trim();
  const images = Array.isArray(value.images)
    ? value.images.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return {
    id,
    name,
    price,
    originalPrice: originalPrice > 0 ? originalPrice : price,
    category: asString(value.category, "uncategorized"),
    district: asString(value.district, "unknown"),
    artisan: asString(value.artisan, ""),
    description: asString(value.description, ""),
    craftProcess: asString(value.craftProcess, ""),
    culturalSignificance: asString(value.culturalSignificance, ""),
    image:
      image ||
      "https://images.unsplash.com/photo-1505252585461-04db1267ae0e?w=500&q=80",
    images,
    inStock: asBoolean(value.inStock, true),
    createdAt: isValidDateString(asString(value.createdAt))
      ? asString(value.createdAt)
      : new Date().toISOString(),
  };
}

function normalizeAdminOrderItem(value: unknown): AdminOrderItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const directProductId = asString(value.productId).trim();
  const productFromNested = isRecord(value.product)
    ? asString(value.product.id).trim()
    : "";
  const productId = directProductId || productFromNested;
  if (!productId) {
    return null;
  }

  const quantity = Math.max(1, Math.floor(asNumber(value.quantity, 1)));
  return { productId, quantity };
}

function normalizeAdminOrder(value: unknown, index: number): AdminOrder | null {
  if (!isRecord(value)) {
    return null;
  }

  const items = Array.isArray(value.items)
    ? value.items
        .map((item) => normalizeAdminOrderItem(item))
        .filter((item): item is AdminOrderItem => item !== null)
    : [];

  if (items.length === 0) {
    return null;
  }

  const id = asString(value.id, `order-${index + 1}`).trim();
  if (!id) {
    return null;
  }

  const subtotal = asNumber(value.subtotal, 0);
  const shipping = asNumber(value.shipping, 0);
  const total =
    asNumber(value.total, subtotal + shipping) || Math.max(0, subtotal + shipping);

  const shippingAddressRecord = isRecord(value.shippingAddress)
    ? value.shippingAddress
    : {};

  const createdAtRaw = asString(value.createdAt);
  const createdAt = isValidDateString(createdAtRaw)
    ? createdAtRaw
    : new Date().toISOString();

  return {
    id,
    userId: asString(value.userId, "unknown-user"),
    items,
    subtotal,
    shipping,
    total,
    status: normalizeOrderStatus(asString(value.status, "pending")),
    paymentMethod: asString(value.paymentMethod, "card"),
    shippingAddress: {
      fullName: asString(shippingAddressRecord.fullName, "Customer"),
      email: asString(shippingAddressRecord.email, ""),
      phone: asString(shippingAddressRecord.phone, ""),
      address: asString(shippingAddressRecord.address, ""),
      city: asString(shippingAddressRecord.city, ""),
      district: asString(shippingAddressRecord.district, ""),
      postalCode: asString(shippingAddressRecord.postalCode, ""),
    },
    createdAt,
  };
}

function normalizeAdminArtisan(value: unknown, index: number): AdminArtisan | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id, `artisan-${index + 1}`).trim();
  const name = asString(value.name).trim();
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    image:
      asString(value.image).trim() ||
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    district: asString(value.district, "Unknown"),
    districtId: asString(value.districtId, "unknown"),
    specialty: asString(value.specialty, "Traditional Crafts"),
    bio: asString(value.bio, ""),
    story: asString(value.story, ""),
    yearsOfExperience: Math.max(0, Math.floor(asNumber(value.yearsOfExperience, 0))),
    productCount: Math.max(0, Math.floor(asNumber(value.productCount, 0))),
    active: asBoolean(value.active, true),
    createdAt: isValidDateString(asString(value.createdAt))
      ? asString(value.createdAt)
      : new Date().toISOString(),
  };
}

function normalizeAdminCategory(value: unknown, index: number): AdminCategory | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id, `category-${index + 1}`).trim();
  const name = asString(value.name).trim();
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    image:
      asString(value.image).trim() ||
      "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=600&q=80",
    description: asString(value.description, ""),
    productCount: Math.max(0, Math.floor(asNumber(value.productCount, 0))),
    active: asBoolean(value.active, true),
    createdAt: isValidDateString(asString(value.createdAt))
      ? asString(value.createdAt)
      : new Date().toISOString(),
  };
}

function normalizeAdminDistrict(value: unknown, index: number): AdminDistrict | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id, `district-${index + 1}`).trim();
  const name = asString(value.name).trim();
  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    division: asString(value.division, "Unknown"),
    image:
      asString(value.image).trim() ||
      "https://images.unsplash.com/photo-1583422528567-5658d8b10c20?w=600&q=80",
    description: asString(value.description, ""),
    productCount: Math.max(0, Math.floor(asNumber(value.productCount, 0))),
    active: asBoolean(value.active, true),
    createdAt: isValidDateString(asString(value.createdAt))
      ? asString(value.createdAt)
      : new Date().toISOString(),
  };
}

function normalizeAdminSettings(value: unknown): AdminSettings {
  if (!isRecord(value)) {
    return DEFAULT_ADMIN_SETTINGS;
  }

  return {
    storeName: asString(value.storeName, DEFAULT_ADMIN_SETTINGS.storeName),
    storeEmail: asString(value.storeEmail, DEFAULT_ADMIN_SETTINGS.storeEmail),
    storePhone: asString(value.storePhone, DEFAULT_ADMIN_SETTINGS.storePhone),
    storeAddress: asString(value.storeAddress, DEFAULT_ADMIN_SETTINGS.storeAddress),
    currencySymbol: asString(
      value.currencySymbol,
      DEFAULT_ADMIN_SETTINGS.currencySymbol
    ),
    shippingFee: asNumber(value.shippingFee, DEFAULT_ADMIN_SETTINGS.shippingFee),
    freeShippingThreshold: asNumber(
      value.freeShippingThreshold,
      DEFAULT_ADMIN_SETTINGS.freeShippingThreshold
    ),
    lowStockThreshold: Math.max(
      0,
      asNumber(value.lowStockThreshold, DEFAULT_ADMIN_SETTINGS.lowStockThreshold)
    ),
    maintenanceMode: asBoolean(
      value.maintenanceMode,
      DEFAULT_ADMIN_SETTINGS.maintenanceMode
    ),
    updatedAt: isValidDateString(asString(value.updatedAt))
      ? asString(value.updatedAt)
      : new Date().toISOString(),
  };
}

function seedAdminProducts(): AdminProduct[] {
  return seedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice ?? product.price,
    category: product.categoryId,
    district: product.districtId,
    artisan: product.artisanId,
    description: product.description,
    craftProcess: product.craftProcess ?? "",
    culturalSignificance: product.culturalSignificance ?? "",
    image: product.image,
    images: product.images,
    inStock: product.inStock,
    createdAt: new Date().toISOString(),
  }));
}

function seedAdminArtisans(): AdminArtisan[] {
  return seedArtisans.map((artisan) => ({
    ...artisan,
    active: true,
    createdAt: new Date().toISOString(),
  }));
}

function seedAdminCategories(): AdminCategory[] {
  return seedCategories.map((category) => ({
    ...category,
    active: true,
    createdAt: new Date().toISOString(),
  }));
}

function seedAdminDistricts(): AdminDistrict[] {
  return seedDistricts.map((district) => ({
    ...district,
    active: true,
    createdAt: new Date().toISOString(),
  }));
}

function getOrSeedArray<T>(
  key: string,
  seedFactory: () => T[],
  normalize: (item: unknown, index: number) => T | null
): T[] {
  const raw = readRaw(key);
  if (raw === null) {
    const seeded = seedFactory();
    writeRaw(key, JSON.stringify(seeded));
    return seeded;
  }

  const parsed = parseJson<unknown[]>(raw);
  if (!Array.isArray(parsed)) {
    const seeded = seedFactory();
    writeRaw(key, JSON.stringify(seeded));
    return seeded;
  }

  const normalized = parsed
    .map((item, index) => normalize(item, index))
    .filter((item): item is T => item !== null);

  if (normalized.length !== parsed.length) {
    writeRaw(key, JSON.stringify(normalized));
  }

  return normalized;
}

export function getCurrentUser(): AdminUser | null {
  const raw = readRaw(STORAGE_KEYS.user);
  const parsed = parseJson<unknown>(raw);
  if (!isRecord(parsed)) {
    return null;
  }

  const id = asString(parsed.id).trim();
  const email = asString(parsed.email).trim();
  const name = asString(parsed.name).trim();
  const role = asString(parsed.role).trim();

  if (!id || !email || !name || !role) {
    return null;
  }

  return {
    id,
    email,
    name,
    role,
    phone: asString(parsed.phone, ""),
  };
}

export function isAdminUser(user: AdminUser | null): boolean {
  return user?.role === "admin";
}

export function getAdminProducts(): AdminProduct[] {
  return getOrSeedArray(
    STORAGE_KEYS.products,
    seedAdminProducts,
    normalizeAdminProduct
  );
}

export function saveAdminProducts(products: AdminProduct[]): void {
  writeRaw(STORAGE_KEYS.products, JSON.stringify(products));
}

export function getAdminOrders(): AdminOrder[] {
  const raw = readRaw(STORAGE_KEYS.orders);
  const parsed = parseJson<unknown[]>(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  const normalized = parsed
    .map((item, index) => normalizeAdminOrder(item, index))
    .filter((item): item is AdminOrder => item !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (normalized.length !== parsed.length) {
    writeRaw(STORAGE_KEYS.orders, JSON.stringify(normalized));
  }

  return normalized;
}

export function saveAdminOrders(orders: AdminOrder[]): void {
  writeRaw(STORAGE_KEYS.orders, JSON.stringify(orders));
}

export function updateAdminOrderStatus(
  orderId: string,
  status: AdminOrderStatus
): AdminOrder[] {
  const updated = getAdminOrders().map((order) =>
    order.id === orderId ? { ...order, status } : order
  );
  saveAdminOrders(updated);
  return updated;
}

export function getAdminArtisans(): AdminArtisan[] {
  return getOrSeedArray(
    STORAGE_KEYS.artisans,
    seedAdminArtisans,
    normalizeAdminArtisan
  );
}

export function saveAdminArtisans(artisans: AdminArtisan[]): void {
  writeRaw(STORAGE_KEYS.artisans, JSON.stringify(artisans));
}

export function getAdminCategories(): AdminCategory[] {
  return getOrSeedArray(
    STORAGE_KEYS.categories,
    seedAdminCategories,
    normalizeAdminCategory
  );
}

export function saveAdminCategories(categories: AdminCategory[]): void {
  writeRaw(STORAGE_KEYS.categories, JSON.stringify(categories));
}

export function getAdminDistricts(): AdminDistrict[] {
  return getOrSeedArray(
    STORAGE_KEYS.districts,
    seedAdminDistricts,
    normalizeAdminDistrict
  );
}

export function saveAdminDistricts(districts: AdminDistrict[]): void {
  writeRaw(STORAGE_KEYS.districts, JSON.stringify(districts));
}

export function getAdminSettings(): AdminSettings {
  const raw = readRaw(STORAGE_KEYS.settings);
  if (raw === null) {
    writeRaw(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_ADMIN_SETTINGS));
    return DEFAULT_ADMIN_SETTINGS;
  }

  const parsed = parseJson<unknown>(raw);
  const normalized = normalizeAdminSettings(parsed);
  writeRaw(STORAGE_KEYS.settings, JSON.stringify(normalized));
  return normalized;
}

export function saveAdminSettings(settings: AdminSettings): void {
  writeRaw(
    STORAGE_KEYS.settings,
    JSON.stringify({ ...settings, updatedAt: new Date().toISOString() })
  );
}

export function getMonthlyRevenueData(orders: AdminOrder[], monthCount = 6): Array<{
  name: string;
  revenue: number;
  orders: number;
}> {
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
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = monthMap.get(key);
    if (!bucket) {
      return;
    }
    bucket.revenue += order.total;
    bucket.orders += 1;
  });

  return months.map(({ name, revenue, orders: orderCount }) => ({
    name,
    revenue,
    orders: orderCount,
  }));
}

export function getProductSalesMap(orders: AdminOrder[]): Record<string, number> {
  const sales: Record<string, number> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      sales[item.productId] = (sales[item.productId] ?? 0) + item.quantity;
    });
  });
  return sales;
}
