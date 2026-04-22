const { query, getClient } = require("../db");
const {
  mapAdminProductRow,
  mapCategoryRow,
  mapDistrictRow,
  mapArtisanRow,
} = require("../utils/serializers");

const PRODUCT_APPROVAL_STATUSES = new Set(["pending", "approved", "rejected"]);

function normalizeImageArray(images, fallbackImage) {
  const safeImages = Array.isArray(images)
    ? images.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];

  if (safeImages.length > 0) return safeImages;
  if (fallbackImage && String(fallbackImage).trim()) return [String(fallbackImage).trim()];
  return [];
}

async function saveProductImages(client, productId, images) {
  await client.query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  for (let index = 0; index < images.length; index += 1) {
    await client.query(
      `INSERT INTO product_images (product_id, image_url, sort_order)
       VALUES ($1, $2, $3)`,
      [productId, images[index], index]
    );
  }
}

async function getAdminProducts() {
  const result = await query(
    `SELECT
       p.id,
       p.name,
       p.price,
       p.original_price,
       p.category_id,
       p.district_id,
       p.artisan_id,
       p.description,
       p.craft_process,
       p.cultural_significance,
       p.image,
       p.in_stock,
       p.approval_status,
       p.approval_note,
       p.approved_by,
       p.approved_at,
       p.created_at,
       COALESCE(
         (
           SELECT json_agg(pi.image_url ORDER BY pi.sort_order ASC)
           FROM product_images pi
           WHERE pi.product_id = p.id
         ),
         '[]'::json
       ) AS images
     FROM products p
     ORDER BY p.created_at DESC`
  );

  return result.rows.map(mapAdminProductRow);
}

async function createAdminProduct(payload, adminUserId) {
  const id = String(payload.id || `prod-${Date.now()}`);
  const image = String(payload.image || "").trim();
  const images = normalizeImageArray(payload.images, image);

  const productResult = await query(
    `INSERT INTO products (
       id,
       name,
       price,
       original_price,
       category_id,
       district_id,
       artisan_id,
       description,
       craft_process,
       cultural_significance,
       image,
       in_stock,
       approval_status,
       approved_by,
       approved_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, NULLIF($7, ''), $8, $9, $10, $11, $12, 'approved', $13, NOW()
     )
     RETURNING id`,
    [
      id,
      String(payload.name || "").trim(),
      Number(payload.price || 0),
      Number(payload.originalPrice || payload.price || 0),
      String(payload.category || "").trim(),
      String(payload.district || "").trim(),
      String(payload.artisan || "").trim(),
      String(payload.description || "").trim(),
      String(payload.craftProcess || "").trim(),
      String(payload.culturalSignificance || "").trim(),
      image,
      Boolean(payload.inStock),
      adminUserId || null,
    ]
  );

  const productId = productResult.rows[0].id;
  const client = await getClient();
  try {
    await client.query("BEGIN");
    await saveProductImages(client, productId, images);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const allProducts = await getAdminProducts();
  return allProducts.find((item) => item.id === productId) || null;
}

async function updateAdminProduct(productId, payload) {
  const image = String(payload.image || "").trim();
  const images = normalizeImageArray(payload.images, image);

  const updateResult = await query(
    `UPDATE products
     SET
       name = $2,
       price = $3,
       original_price = $4,
       category_id = $5,
       district_id = $6,
       artisan_id = NULLIF($7, ''),
       description = $8,
       craft_process = $9,
       cultural_significance = $10,
       image = $11,
       in_stock = $12,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [
      productId,
      String(payload.name || "").trim(),
      Number(payload.price || 0),
      Number(payload.originalPrice || payload.price || 0),
      String(payload.category || "").trim(),
      String(payload.district || "").trim(),
      String(payload.artisan || "").trim(),
      String(payload.description || "").trim(),
      String(payload.craftProcess || "").trim(),
      String(payload.culturalSignificance || "").trim(),
      image,
      Boolean(payload.inStock),
    ]
  );

  if (updateResult.rowCount === 0) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await saveProductImages(client, productId, images);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const allProducts = await getAdminProducts();
  return allProducts.find((item) => item.id === productId) || null;
}

async function updateAdminProductApproval(productId, status, reviewerId, note = "") {
  const normalizedStatus = String(status || "").toLowerCase();
  if (!PRODUCT_APPROVAL_STATUSES.has(normalizedStatus)) {
    const error = new Error("Invalid product approval status.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedNote = String(note || "").trim();
  const updateResult = await query(
    `UPDATE products
     SET
       approval_status = $2,
       approval_note = CASE
         WHEN $2 = 'rejected' THEN NULLIF($3, '')
         ELSE NULL
       END,
       approved_by = $4,
       approved_at = NOW(),
       updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [productId, normalizedStatus, normalizedNote, reviewerId || null]
  );

  if (updateResult.rowCount === 0) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const allProducts = await getAdminProducts();
  return allProducts.find((item) => item.id === productId) || null;
}

async function deleteAdminProduct(productId) {
  const usageResult = await query(
    `SELECT COUNT(*)::int AS order_item_count
     FROM order_items
     WHERE product_id = $1`,
    [productId]
  );
  const orderItemCount = Number(usageResult.rows[0]?.order_item_count || 0);
  if (orderItemCount > 0) {
    const error = new Error(
      `This product cannot be deleted because it is used in ${orderItemCount} order record(s).`
    );
    error.statusCode = 409;
    throw error;
  }

  const result = await query(
    `DELETE FROM products
     WHERE id = $1
     RETURNING id`,
    [productId]
  );

  if (result.rowCount === 0) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }
}

async function getAdminCategories() {
  const result = await query(
    `SELECT
       c.id,
       c.name,
       c.image,
       c.description,
       c.active,
       c.created_at,
       COUNT(p.id)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  );

  return result.rows.map(mapCategoryRow);
}

async function createAdminCategory(payload) {
  const result = await query(
    `INSERT INTO categories (id, name, image, description, active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      String(payload.id || "").trim(),
      String(payload.name || "").trim(),
      String(payload.image || "").trim(),
      String(payload.description || "").trim(),
      payload.active !== undefined ? Boolean(payload.active) : true,
    ]
  );
  return result.rows[0].id;
}

async function updateAdminCategory(categoryId, payload) {
  const result = await query(
    `UPDATE categories
     SET
       name = $2,
       image = $3,
       description = $4,
       active = $5
     WHERE id = $1
     RETURNING id`,
    [
      categoryId,
      String(payload.name || "").trim(),
      String(payload.image || "").trim(),
      String(payload.description || "").trim(),
      Boolean(payload.active),
    ]
  );
  if (result.rowCount === 0) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0].id;
}

async function deleteAdminCategory(categoryId) {
  await query(`DELETE FROM categories WHERE id = $1`, [categoryId]);
}

async function getAdminDistricts() {
  const result = await query(
    `SELECT
       d.id,
       d.name,
       d.division,
       d.image,
       d.description,
       d.active,
       d.created_at,
       COUNT(p.id)::int AS product_count
     FROM districts d
     LEFT JOIN products p ON p.district_id = d.id
     GROUP BY d.id
     ORDER BY d.created_at DESC`
  );
  return result.rows.map(mapDistrictRow);
}

async function createAdminDistrict(payload) {
  const result = await query(
    `INSERT INTO districts (id, name, division, image, description, active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      String(payload.id || "").trim(),
      String(payload.name || "").trim(),
      String(payload.division || "").trim(),
      String(payload.image || "").trim(),
      String(payload.description || "").trim(),
      payload.active !== undefined ? Boolean(payload.active) : true,
    ]
  );
  return result.rows[0].id;
}

async function updateAdminDistrict(districtId, payload) {
  const result = await query(
    `UPDATE districts
     SET
       name = $2,
       division = $3,
       image = $4,
       description = $5,
       active = $6
     WHERE id = $1
     RETURNING id`,
    [
      districtId,
      String(payload.name || "").trim(),
      String(payload.division || "").trim(),
      String(payload.image || "").trim(),
      String(payload.description || "").trim(),
      Boolean(payload.active),
    ]
  );

  if (result.rowCount === 0) {
    const error = new Error("District not found.");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0].id;
}

async function deleteAdminDistrict(districtId) {
  await query(`DELETE FROM districts WHERE id = $1`, [districtId]);
}

async function getAdminArtisans() {
  const result = await query(
    `SELECT
       a.id,
       a.name,
       a.image,
       a.district_id,
       d.name AS district_name,
       a.specialty,
       a.bio,
       a.story,
       a.years_of_experience,
       a.active,
       a.created_at,
       COUNT(p.id)::int AS product_count
     FROM artisans a
     INNER JOIN districts d ON d.id = a.district_id
     LEFT JOIN products p ON p.artisan_id = a.id
     GROUP BY a.id, d.name
     ORDER BY a.created_at DESC`
  );
  return result.rows.map(mapArtisanRow);
}

async function createAdminArtisan(payload) {
  const result = await query(
    `INSERT INTO artisans (
       id,
       name,
       image,
       district_id,
       specialty,
       bio,
       story,
       years_of_experience,
       active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      String(payload.id || "").trim(),
      String(payload.name || "").trim(),
      String(payload.image || "").trim(),
      String(payload.districtId || "").trim(),
      String(payload.specialty || "").trim(),
      String(payload.bio || "").trim(),
      String(payload.story || "").trim(),
      Number(payload.yearsOfExperience || 0),
      payload.active !== undefined ? Boolean(payload.active) : true,
    ]
  );
  return result.rows[0].id;
}

async function updateAdminArtisan(artisanId, payload) {
  const result = await query(
    `UPDATE artisans
     SET
       name = $2,
       image = $3,
       district_id = $4,
       specialty = $5,
       bio = $6,
       story = $7,
       years_of_experience = $8,
       active = $9
     WHERE id = $1
     RETURNING id`,
    [
      artisanId,
      String(payload.name || "").trim(),
      String(payload.image || "").trim(),
      String(payload.districtId || "").trim(),
      String(payload.specialty || "").trim(),
      String(payload.bio || "").trim(),
      String(payload.story || "").trim(),
      Number(payload.yearsOfExperience || 0),
      Boolean(payload.active),
    ]
  );

  if (result.rowCount === 0) {
    const error = new Error("Artisan not found.");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0].id;
}

async function deleteAdminArtisan(artisanId) {
  await query(`DELETE FROM artisans WHERE id = $1`, [artisanId]);
}

async function getAdminSettings() {
  const result = await query(`SELECT * FROM settings WHERE id = 1 LIMIT 1`);

  if (result.rowCount === 0) {
    await query(
      `INSERT INTO settings (
         id,
         store_name,
         store_email,
         store_phone,
         store_address,
         currency_symbol,
         shipping_fee,
         free_shipping_threshold,
         low_stock_threshold,
         maintenance_mode
       )
       VALUES (1, $1, $2, $3, $4, 'BDT', 200, 5000, 5, FALSE)`,
      [
        "Bangladesh Heritage",
        "admin@heritage.com",
        "+880 1700 000000",
        "Dhaka, Bangladesh",
      ]
    );

    const fallback = await query(`SELECT * FROM settings WHERE id = 1 LIMIT 1`);
    return mapSettings(fallback.rows[0]);
  }

  return mapSettings(result.rows[0]);
}

function mapSettings(row) {
  return {
    storeName: row.store_name,
    storeEmail: row.store_email,
    storePhone: row.store_phone,
    storeAddress: row.store_address,
    currencySymbol: row.currency_symbol,
    shippingFee: Number(row.shipping_fee || 200),
    freeShippingThreshold: Number(row.free_shipping_threshold || 5000),
    lowStockThreshold: Number(row.low_stock_threshold || 5),
    maintenanceMode: Boolean(row.maintenance_mode),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

async function updateAdminSettings(payload) {
  const result = await query(
    `UPDATE settings
     SET
       store_name = $1,
       store_email = $2,
       store_phone = $3,
       store_address = $4,
       currency_symbol = $5,
       shipping_fee = $6,
       free_shipping_threshold = $7,
       low_stock_threshold = $8,
       maintenance_mode = $9,
       updated_at = NOW()
     WHERE id = 1
     RETURNING *`,
    [
      String(payload.storeName || "").trim(),
      String(payload.storeEmail || "").trim(),
      String(payload.storePhone || "").trim(),
      String(payload.storeAddress || "").trim(),
      String(payload.currencySymbol || "BDT").trim(),
      Math.max(0, Number(payload.shippingFee || 0)),
      Math.max(0, Number(payload.freeShippingThreshold || 0)),
      Math.max(0, Number(payload.lowStockThreshold || 0)),
      Boolean(payload.maintenanceMode),
    ]
  );

  if (result.rowCount === 0) {
    const error = new Error("Settings not found.");
    error.statusCode = 404;
    throw error;
  }

  return mapSettings(result.rows[0]);
}

module.exports = {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  updateAdminProductApproval,
  deleteAdminProduct,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminDistricts,
  createAdminDistrict,
  updateAdminDistrict,
  deleteAdminDistrict,
  getAdminArtisans,
  createAdminArtisan,
  updateAdminArtisan,
  deleteAdminArtisan,
  getAdminSettings,
  updateAdminSettings,
};
