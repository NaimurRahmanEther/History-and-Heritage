const { getClient, query } = require("../db");
const { mapAdminProductRow, mapOrderRow } = require("../utils/serializers");
const { ORDER_STATUSES } = require("./order_service");

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

async function getArtisanProfileByUserId(userId) {
  const result = await query(
    `SELECT
       a.id,
       a.user_id,
       a.name,
       a.image,
       a.district_id,
       d.name AS district_name,
       a.specialty,
       a.bio,
       a.story,
       a.years_of_experience,
       a.active,
       a.created_at
     FROM artisans a
     INNER JOIN districts d ON d.id = a.district_id
     WHERE a.user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    image: row.image,
    districtId: row.district_id,
    districtName: row.district_name,
    specialty: row.specialty,
    bio: row.bio,
    story: row.story,
    yearsOfExperience: Number(row.years_of_experience || 0),
    active: Boolean(row.active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

async function requireArtisanProfile(userId) {
  const artisan = await getArtisanProfileByUserId(userId);
  if (!artisan || !artisan.active) {
    const error = new Error("Artisan profile is not active.");
    error.statusCode = 403;
    throw error;
  }
  return artisan;
}

async function updateArtisanProfile(userId, payload = {}) {
  await requireArtisanProfile(userId);
  const image = String(payload.image || "").trim();

  if (!image) {
    const error = new Error("Profile image is required.");
    error.statusCode = 400;
    throw error;
  }

  const updateResult = await query(
    `UPDATE artisans
     SET image = $2
     WHERE user_id = $1
     RETURNING id`,
    [userId, image]
  );

  if (updateResult.rowCount === 0) {
    const error = new Error("Artisan profile not found.");
    error.statusCode = 404;
    throw error;
  }

  return getArtisanProfileByUserId(userId);
}

async function getArtisanProducts(userId) {
  const artisan = await requireArtisanProfile(userId);
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
     WHERE p.artisan_id = $1
     ORDER BY p.created_at DESC`,
    [artisan.id]
  );

  return result.rows.map(mapAdminProductRow);
}

async function createArtisanProduct(userId, payload) {
  const artisan = await requireArtisanProfile(userId);
  const productId = String(payload.id || `prod-${Date.now()}`);
  const image = String(payload.image || "").trim();
  const images = normalizeImageArray(payload.images, image);

  const insertResult = await query(
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
       approval_status
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending'
     )
     RETURNING id`,
    [
      productId,
      String(payload.name || "").trim(),
      Number(payload.price || 0),
      Number(payload.originalPrice || payload.price || 0),
      String(payload.category || "").trim(),
      String(payload.district || "").trim(),
      artisan.id,
      String(payload.description || "").trim(),
      String(payload.craftProcess || "").trim(),
      String(payload.culturalSignificance || "").trim(),
      image,
      payload.inStock !== undefined ? Boolean(payload.inStock) : true,
    ]
  );

  const createdProductId = insertResult.rows[0].id;
  const client = await getClient();
  try {
    await client.query("BEGIN");
    await saveProductImages(client, createdProductId, images);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const products = await getArtisanProducts(userId);
  return products.find((item) => item.id === createdProductId) || null;
}

async function updateArtisanProduct(userId, productId, payload) {
  const artisan = await requireArtisanProfile(userId);
  const image = String(payload.image || "").trim();
  const images = normalizeImageArray(payload.images, image);

  const updateResult = await query(
    `UPDATE products
     SET
       name = $3,
       price = $4,
       original_price = $5,
       category_id = $6,
       district_id = $7,
       description = $8,
       craft_process = $9,
       cultural_significance = $10,
       image = $11,
       in_stock = $12,
       updated_at = NOW()
     WHERE id = $1 AND artisan_id = $2
     RETURNING id`,
    [
      productId,
      artisan.id,
      String(payload.name || "").trim(),
      Number(payload.price || 0),
      Number(payload.originalPrice || payload.price || 0),
      String(payload.category || "").trim(),
      String(payload.district || "").trim(),
      String(payload.description || "").trim(),
      String(payload.craftProcess || "").trim(),
      String(payload.culturalSignificance || "").trim(),
      image,
      payload.inStock !== undefined ? Boolean(payload.inStock) : true,
    ]
  );

  if (updateResult.rowCount === 0) {
    const error = new Error("Product not found for this artisan.");
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

  const products = await getArtisanProducts(userId);
  return products.find((item) => item.id === productId) || null;
}

async function deleteArtisanProduct(userId, productId) {
  const artisan = await requireArtisanProfile(userId);
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
     WHERE id = $1 AND artisan_id = $2
     RETURNING id`,
    [productId, artisan.id]
  );

  if (result.rowCount === 0) {
    const error = new Error("Product not found for this artisan.");
    error.statusCode = 404;
    throw error;
  }
}

async function getOrderItemsDetailed(orderId) {
  const result = await query(
    `SELECT
       oi.product_id,
       oi.quantity,
       oi.unit_price,
       p.name AS product_name,
       p.image AS product_image,
       p.artisan_id
     FROM order_items oi
     INNER JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC`,
    [orderId]
  );
  return result.rows;
}

function mapArtisanOrder(row, detailedItems, artisanId) {
  const baseOrder = mapOrderRow({
    ...row,
    items: detailedItems.map((item) => ({
      productId: item.product_id,
      quantity: Number(item.quantity || 1),
    })),
  });

  const items = detailedItems.map((item) => ({
    productId: item.product_id,
    productName: item.product_name || "",
    productImage: item.product_image || "",
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unit_price || 0),
    belongsToArtisan: item.artisan_id === artisanId,
  }));

  const artisanItemCount = items
    .filter((item) => item.belongsToArtisan)
    .reduce((sum, item) => sum + item.quantity, 0);
  const hasForeignItems = items.some((item) => !item.belongsToArtisan);

  return {
    ...baseOrder,
    items,
    artisanItemCount,
    hasForeignItems,
  };
}

async function getArtisanOrders(userId) {
  const artisan = await requireArtisanProfile(userId);
  const ordersResult = await query(
    `SELECT DISTINCT o.*
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id
     INNER JOIN products p ON p.id = oi.product_id
     WHERE p.artisan_id = $1
     ORDER BY o.created_at DESC`,
    [artisan.id]
  );

  const orders = [];
  for (const row of ordersResult.rows) {
    const detailedItems = await getOrderItemsDetailed(row.id);
    orders.push(mapArtisanOrder(row, detailedItems, artisan.id));
  }
  return orders;
}

async function getArtisanOrderById(userId, orderId) {
  const artisan = await requireArtisanProfile(userId);
  const orderResult = await query(
    `SELECT *
     FROM orders
     WHERE id = $1
     LIMIT 1`,
    [orderId]
  );

  if (orderResult.rowCount === 0) return null;

  const detailedItems = await getOrderItemsDetailed(orderId);
  const includesArtisanItem = detailedItems.some((item) => item.artisan_id === artisan.id);
  if (!includesArtisanItem) return null;

  return mapArtisanOrder(orderResult.rows[0], detailedItems, artisan.id);
}

async function getArtisanDashboardSummary(userId) {
  const artisan = await requireArtisanProfile(userId);
  const [productsResult, ordersResult] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS total_products,
         COUNT(*) FILTER (WHERE in_stock = TRUE)::int AS in_stock_products
       FROM products
       WHERE artisan_id = $1`,
      [artisan.id]
    ),
    query(
      `SELECT DISTINCT o.id, o.status
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       INNER JOIN products p ON p.id = oi.product_id
       WHERE p.artisan_id = $1`,
      [artisan.id]
    ),
  ]);

  const allOrders = ordersResult.rows;
  const pendingOrders = allOrders.filter((item) =>
    ["pending", "processing"].includes(item.status)
  ).length;

  return {
    artisan,
    totalProducts: Number(productsResult.rows[0]?.total_products || 0),
    inStockProducts: Number(productsResult.rows[0]?.in_stock_products || 0),
    totalOrders: allOrders.length,
    pendingOrders,
  };
}

async function updateArtisanOrderStatus(userId, orderId, status) {
  const artisanOrder = await getArtisanOrderById(userId, orderId);
  if (!artisanOrder) {
    const error = new Error("Order not found for this artisan.");
    error.statusCode = 404;
    throw error;
  }

  if (artisanOrder.hasForeignItems) {
    const error = new Error(
      "Shared orders containing items from multiple artisans are read-only for artisans."
    );
    error.statusCode = 403;
    throw error;
  }

  const normalizedStatus = String(status || "").toLowerCase();
  if (!ORDER_STATUSES.has(normalizedStatus)) {
    const error = new Error("Invalid order status.");
    error.statusCode = 400;
    throw error;
  }

  await query(
    `UPDATE orders
     SET status = $2, updated_at = NOW()
     WHERE id = $1`,
    [orderId, normalizedStatus]
  );

  return getArtisanOrderById(userId, orderId);
}

module.exports = {
  getArtisanProfileByUserId,
  updateArtisanProfile,
  getArtisanDashboardSummary,
  getArtisanProducts,
  createArtisanProduct,
  updateArtisanProduct,
  deleteArtisanProduct,
  getArtisanOrders,
  getArtisanOrderById,
  updateArtisanOrderStatus,
};
