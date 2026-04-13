const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  createOrderFromCart,
  listOrdersByUser,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
} = require("../services/order_service");

const router = express.Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const order = await createOrderFromCart(req.user.id, req.body || {});
    return res.status(201).json({
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/my", requireAuth, async (req, res, next) => {
  try {
    const orders = await listOrdersByUser(req.user.id);
    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/all", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const orders = await listAllOrders();
    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed to view this order." });
    }

    return res.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const order = await updateOrderStatus(req.params.id, req.body?.status);
    return res.status(200).json({
      message: "Order status updated.",
      order,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

