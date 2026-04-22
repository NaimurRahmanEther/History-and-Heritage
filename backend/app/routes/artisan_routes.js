const express = require("express");
const { requireAuth, requireArtisan } = require("../middleware/auth");
const {
  getArtisanDashboardSummary,
  getArtisanProfileByUserId,
  updateArtisanProfile,
  getArtisanProducts,
  createArtisanProduct,
  updateArtisanProduct,
  deleteArtisanProduct,
  getArtisanOrders,
  getArtisanOrderById,
  updateArtisanOrderStatus,
} = require("../services/artisan_service");

const router = express.Router();

router.use(requireAuth, requireArtisan);

router.get("/dashboard", async (req, res, next) => {
  try {
    const summary = await getArtisanDashboardSummary(req.user.id);
    return res.status(200).json({ summary });
  } catch (error) {
    return next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const artisan = await getArtisanProfileByUserId(req.user.id);
    if (!artisan) {
      return res.status(404).json({ message: "Artisan profile not found." });
    }
    return res.status(200).json({ artisan });
  } catch (error) {
    return next(error);
  }
});

router.patch("/profile", async (req, res, next) => {
  try {
    const artisan = await updateArtisanProfile(req.user.id, req.body || {});
    return res.status(200).json({
      message: "Artisan profile updated.",
      artisan,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const products = await getArtisanProducts(req.user.id);
    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const product = await createArtisanProduct(req.user.id, req.body || {});
    return res.status(201).json({
      message: "Product submitted for admin approval.",
      product,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    const product = await updateArtisanProduct(req.user.id, req.params.id, req.body || {});
    return res.status(200).json({
      message: "Product updated.",
      product,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    await deleteArtisanProduct(req.user.id, req.params.id);
    return res.status(200).json({ message: "Product deleted." });
  } catch (error) {
    return next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const orders = await getArtisanOrders(req.user.id);
    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
});

router.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await getArtisanOrderById(req.user.id, req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found for this artisan." });
    }
    return res.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const order = await updateArtisanOrderStatus(req.user.id, req.params.id, req.body?.status);
    return res.status(200).json({
      message: "Order status updated.",
      order,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
