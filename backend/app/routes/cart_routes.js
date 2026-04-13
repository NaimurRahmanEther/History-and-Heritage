const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getCartByUserId,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
} = require("../services/cart_service");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const cart = await getCartByUserId(req.user.id);
    return res.status(200).json(cart);
  } catch (error) {
    return next(error);
  }
});

router.post("/items", requireAuth, async (req, res, next) => {
  try {
    const { productId, quantity } = req.body || {};
    if (!productId) {
      return res.status(400).json({ message: "productId is required." });
    }
    const cart = await addCartItem(req.user.id, productId, quantity);
    return res.status(200).json(cart);
  } catch (error) {
    return next(error);
  }
});

router.patch("/items/:productId", requireAuth, async (req, res, next) => {
  try {
    const cart = await updateCartItem(
      req.user.id,
      req.params.productId,
      req.body?.quantity
    );
    return res.status(200).json(cart);
  } catch (error) {
    return next(error);
  }
});

router.delete("/items/:productId", requireAuth, async (req, res, next) => {
  try {
    const cart = await removeCartItem(req.user.id, req.params.productId);
    return res.status(200).json(cart);
  } catch (error) {
    return next(error);
  }
});

router.delete("/clear", requireAuth, async (req, res, next) => {
  try {
    const cart = await clearCart(req.user.id);
    return res.status(200).json(cart);
  } catch (error) {
    return next(error);
  }
});

router.post("/sync", requireAuth, async (req, res, next) => {
  try {
    const cart = await syncCart(req.user.id, req.body?.items || []);
    return res.status(200).json(cart);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

