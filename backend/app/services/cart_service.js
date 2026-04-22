const { getClient, query } = require("../db");
const { mapProductRow } = require("../utils/serializers");

async function getStoreSettings() {
  const result = await query(
    `SELECT shipping_fee, free_shipping_threshold
     FROM settings
     WHERE id = 1`
  );
  if (result.rowCount === 0) {
    return { shippingFee: 200, freeShippingThreshold: 5000 };
  }
  return {
    shippingFee: Number(result.rows[0].shipping_fee || 200),
    freeShippingThreshold: Number(result.rows[0].free_shipping_threshold || 5000),
  };
}

async function ensureCart(userId) {
  await query(
    `INSERT INTO carts (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  const cartResult = await query(`SELECT id FROM carts WHERE user_id = $1 LIMIT 1`, [userId]);
  return cartResult.rows[0].id;
}

async function getCartByUserId(userId) {
  const cartId = await ensureCart(userId);
  const itemsResult = await query(
    `SELECT
       ci.product_id,
       ci.quantity,
       p.id,
       p.name,
       p.price,
       p.original_price,
       p.image,
       p.rating,
       p.review_count,
       p.description,
       p.craft_process,
       p.cultural_significance,
       p.artisan_id,
       p.in_stock,
       c.id AS category_id,
       c.name AS category_name,
       d.id AS district_id,
       d.name AS district_name,
       COALESCE(
         (
           SELECT json_agg(pi.image_url ORDER BY pi.sort_order ASC)
           FROM product_images pi
           WHERE pi.product_id = p.id
         ),
         '[]'::json
       ) AS images
     FROM cart_items ci
     INNER JOIN products p
       ON p.id = ci.product_id
      AND p.approval_status = 'approved'
     INNER JOIN categories c ON c.id = p.category_id
     INNER JOIN districts d ON d.id = p.district_id
     WHERE ci.cart_id = $1
     ORDER BY p.created_at DESC`,
    [cartId]
  );

  const items = itemsResult.rows.map((row) => ({
    productId: row.product_id,
    quantity: Number(row.quantity),
    product: mapProductRow(row),
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price || 0) * item.quantity,
    0
  );
  const { shippingFee, freeShippingThreshold } = await getStoreSettings();
  const shipping = subtotal > freeShippingThreshold ? 0 : shippingFee;

  return {
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

async function addCartItem(userId, productId, quantity) {
  const qty = Math.max(1, Math.floor(Number(quantity || 1)));

  const productResult = await query(
    `SELECT id
     FROM products
     WHERE id = $1
       AND approval_status = 'approved'
     LIMIT 1`,
    [productId]
  );
  if (productResult.rowCount === 0) {
    const error = new Error("Product is not available for purchase.");
    error.statusCode = 404;
    throw error;
  }

  const cartId = await ensureCart(userId);
  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [cartId, productId, qty]
  );

  await query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cartId]);
  return getCartByUserId(userId);
}

async function updateCartItem(userId, productId, quantity) {
  const qty = Math.floor(Number(quantity || 0));
  const cartId = await ensureCart(userId);

  if (qty < 1) {
    await query(
      `DELETE FROM cart_items
       WHERE cart_id = $1 AND product_id = $2`,
      [cartId, productId]
    );
  } else {
    const productResult = await query(
      `SELECT id
       FROM products
       WHERE id = $1
         AND approval_status = 'approved'
       LIMIT 1`,
      [productId]
    );
    if (productResult.rowCount === 0) {
      const error = new Error("Product is not available for purchase.");
      error.statusCode = 404;
      throw error;
    }

    await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity`,
      [cartId, productId, qty]
    );
  }

  await query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cartId]);
  return getCartByUserId(userId);
}

async function removeCartItem(userId, productId) {
  const cartId = await ensureCart(userId);
  await query(
    `DELETE FROM cart_items
     WHERE cart_id = $1 AND product_id = $2`,
    [cartId, productId]
  );
  await query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cartId]);
  return getCartByUserId(userId);
}

async function clearCart(userId) {
  const cartId = await ensureCart(userId);
  await query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
  await query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cartId]);
  return getCartByUserId(userId);
}

async function syncCart(userId, items) {
  const client = await getClient();
  try {
    const cartId = await ensureCart(userId);
    await client.query("BEGIN");
    await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);

    for (const item of Array.isArray(items) ? items : []) {
      const productId = String(item?.productId || "");
      const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
      if (!productId) continue;

      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         SELECT $1, p.id, $3
         FROM products p
         WHERE p.id = $2
           AND p.approval_status = 'approved'
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = EXCLUDED.quantity`,
        [cartId, productId, quantity]
      );
    }

    await client.query(`UPDATE carts SET updated_at = NOW() WHERE id = $1`, [cartId]);
    await client.query("COMMIT");
    return getCartByUserId(userId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  ensureCart,
  getStoreSettings,
  getCartByUserId,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
};
