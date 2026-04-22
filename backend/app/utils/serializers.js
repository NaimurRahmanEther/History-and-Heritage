function parseImageArray(value, fallbackImage) {
  if (Array.isArray(value)) {
    if (value.length > 0) return value;
    return fallbackImage ? [fallbackImage] : [];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // Ignore parse errors.
    }
  }

  return fallbackImage ? [fallbackImage] : [];
}

function mapProductRow(row) {
  const fallbackImage = row.image || "";
  const images = parseImageArray(row.images, fallbackImage);

  return {
    id: row.id,
    name: row.name,
    price: Number(row.price || 0),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    image: fallbackImage,
    images,
    district: row.district_name || row.district || "",
    districtId: row.district_id || "",
    category: row.category_name || row.category || "",
    categoryId: row.category_id || "",
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    description: row.description || "",
    artisanId: row.artisan_id || "",
    inStock: Boolean(row.in_stock),
    approvalStatus: row.approval_status || "approved",
    approvalNote: row.approval_note || "",
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
    craftProcess: row.craft_process || undefined,
    culturalSignificance: row.cultural_significance || undefined,
  };
}

function mapAdminProductRow(row) {
  const fallbackImage = row.image || "";
  const images = parseImageArray(row.images, fallbackImage);

  return {
    id: row.id,
    name: row.name,
    price: Number(row.price || 0),
    originalPrice: row.original_price ? Number(row.original_price) : Number(row.price || 0),
    category: row.category_id || "",
    district: row.district_id || "",
    artisan: row.artisan_id || "",
    description: row.description || "",
    craftProcess: row.craft_process || "",
    culturalSignificance: row.cultural_significance || "",
    image: fallbackImage,
    images,
    inStock: Boolean(row.in_stock),
    approvalStatus: row.approval_status || "approved",
    approvalNote: row.approval_note || "",
    approvedBy: row.approved_by || "",
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapCategoryRow(row) {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    description: row.description || "",
    productCount: Number(row.product_count || 0),
    active: row.active === undefined ? true : Boolean(row.active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapDistrictRow(row) {
  return {
    id: row.id,
    name: row.name,
    division: row.division || "",
    image: row.image || "",
    description: row.description || "",
    productCount: Number(row.product_count || 0),
    active: row.active === undefined ? true : Boolean(row.active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapArtisanRow(row) {
  return {
    id: row.id,
    name: row.name,
    image: row.image || "",
    district: row.district_name || row.district || "",
    districtId: row.district_id || "",
    specialty: row.specialty || "",
    bio: row.bio || "",
    story: row.story || "",
    yearsOfExperience: Number(row.years_of_experience || 0),
    productCount: Number(row.product_count || 0),
    active: row.active === undefined ? true : Boolean(row.active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapOrderRow(row) {
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const items = itemsRaw.map((item) => ({
    productId: item.productId || item.product_id,
    quantity: Number(item.quantity || 1),
  }));

  return {
    id: row.id,
    userId: row.user_id,
    items,
    subtotal: Number(row.subtotal || 0),
    shipping: Number(row.shipping || 0),
    total: Number(row.total || 0),
    status: row.status || "pending",
    paymentMethod: row.payment_method || "card",
    shippingAddress: {
      fullName: row.shipping_full_name || "",
      email: row.shipping_email || "",
      phone: row.shipping_phone || "",
      address: row.shipping_address || "",
      city: row.shipping_city || "",
      district: row.shipping_district || "",
      postalCode: row.shipping_postal_code || "",
    },
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

module.exports = {
  mapProductRow,
  mapAdminProductRow,
  mapCategoryRow,
  mapDistrictRow,
  mapArtisanRow,
  mapOrderRow,
};
