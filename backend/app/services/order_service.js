const { getClient, query } = require("../db");
const { ensureCart, getStoreSettings } = require("./cart_service");
const { mapOrderRow } = require("../utils/serializers");

const ORDER_STATUSES = new Set([
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
]);

function validateShippingAddress(shippingAddress) {
  const requiredFields = [
    "fullName",
    "email",
    "phone",
    "address",
    "city",
    "district",
  ];

  const missing = requiredFields.filter(
    (field) => !String(shippingAddress?.[field] || "").trim()
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

async function getOrderItems(orderId) {
  const result = await query(
    `SELECT product_id, quantity
     FROM order_items
     WHERE order_id = $1
     ORDER BY id ASC`,
    [orderId]
  );

  return result.rows.map((row) => ({
    productId: row.product_id,
    quantity: Number(row.quantity || 1),
  }));
}

async function createOrderFromCart(userId, payload) {
  const shippingAddress = payload?.shippingAddress || {};
  const paymentMethod = String(payload?.paymentMethod || "card");
  const validation = validateShippingAddress(shippingAddress);
  if (!validation.valid) {
    const error = new Error(`Missing shipping fields: ${validation.missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const cartId = await ensureCart(userId);
  const cartItemsResult = await query(
    `SELECT ci.product_id, ci.quantity, p.price
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1`,
    [cartId]
  );

  if (cartItemsResult.rowCount === 0) {
    const error = new Error("Cart is empty.");
    error.statusCode = 400;
    throw error;
  }

  const subtotal = cartItemsResult.rows.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const { shippingFee, freeShippingThreshold } = await getStoreSettings();
  const shipping = subtotal > freeShippingThreshold ? 0 : shippingFee;
  const total = subtotal + shipping;
  const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO orders (
         id,
         user_id,
         subtotal,
         shipping,
         total,
         status,
         payment_method,
         shipping_full_name,
         shipping_email,
         shipping_phone,
         shipping_address,
         shipping_city,
         shipping_district,
         shipping_postal_code
       )
       VALUES (
         $1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, $11, $12, $13
       )`,
      [
        orderId,
        userId,
        subtotal,
        shipping,
        total,
        paymentMethod,
        String(shippingAddress.fullName || "").trim(),
        String(shippingAddress.email || "").trim(),
        String(shippingAddress.phone || "").trim(),
        String(shippingAddress.address || "").trim(),
        String(shippingAddress.city || "").trim(),
        String(shippingAddress.district || "").trim(),
        String(shippingAddress.postalCode || "").trim(),
      ]
    );

    for (const item of cartItemsResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, Number(item.quantity || 1), Number(item.price || 0)]
      );
    }

    await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
    await client.query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cartId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getOrderById(orderId);
}

async function listOrdersByUser(userId) {
  const result = await query(
    `SELECT *
     FROM orders
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  const orders = [];
  for (const row of result.rows) {
    row.items = await getOrderItems(row.id);
    orders.push(mapOrderRow(row));
  }
  return orders;
}

async function listAllOrders() {
  const result = await query(
    `SELECT *
     FROM orders
     ORDER BY created_at DESC`
  );

  const orders = [];
  for (const row of result.rows) {
    row.items = await getOrderItems(row.id);
    orders.push(mapOrderRow(row));
  }
  return orders;
}

async function getOrderById(orderId) {
  const result = await query(`SELECT * FROM orders WHERE id = $1 LIMIT 1`, [orderId]);
  if (result.rowCount === 0) return null;
  const order = result.rows[0];
  order.items = await getOrderItems(order.id);
  return mapOrderRow(order);
}

async function updateOrderStatus(orderId, status) {
  const normalizedStatus = String(status || "").toLowerCase();
  if (!ORDER_STATUSES.has(normalizedStatus)) {
    const error = new Error("Invalid order status.");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `UPDATE orders
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [orderId, normalizedStatus]
  );

  if (result.rowCount === 0) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  const order = result.rows[0];
  order.items = await getOrderItems(order.id);
  return mapOrderRow(order);
}

module.exports = {
  ORDER_STATUSES,
  createOrderFromCart,
  listOrdersByUser,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
};

