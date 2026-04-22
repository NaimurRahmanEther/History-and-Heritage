const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
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
} = require("../services/admin_service");
const { listAllOrders, updateOrderStatus, deleteOrder } = require("../services/order_service");
const {
  listArtisanApplications,
  approveArtisanApplication,
  rejectArtisanApplication,
} = require("../services/artisan_application_service");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/products", async (_req, res, next) => {
  try {
    const products = await getAdminProducts();
    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const product = await createAdminProduct(req.body || {}, req.user.id);
    return res.status(201).json({
      message: "Product created.",
      product,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    const product = await updateAdminProduct(req.params.id, req.body || {});
    return res.status(200).json({
      message: "Product updated.",
      product,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/products/:id/approval", async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toLowerCase();
    const product = await updateAdminProductApproval(
      req.params.id,
      status,
      req.user.id,
      req.body?.note
    );

    const message =
      status === "approved" ? "Product approved." : status === "rejected" ? "Product rejected." : "Product updated.";

    return res.status(200).json({
      message,
      product,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    await deleteAdminProduct(req.params.id);
    return res.status(200).json({ message: "Product deleted." });
  } catch (error) {
    return next(error);
  }
});

router.get("/orders", async (_req, res, next) => {
  try {
    const orders = await listAllOrders();
    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
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

router.delete("/orders/:id", async (req, res, next) => {
  try {
    await deleteOrder(req.params.id);
    return res.status(200).json({ message: "Order deleted." });
  } catch (error) {
    return next(error);
  }
});

router.get("/artisans", async (_req, res, next) => {
  try {
    const artisans = await getAdminArtisans();
    return res.status(200).json({ artisans });
  } catch (error) {
    return next(error);
  }
});

router.post("/artisans", async (req, res, next) => {
  try {
    const artisanId = await createAdminArtisan(req.body || {});
    const artisans = await getAdminArtisans();
    const artisan = artisans.find((item) => item.id === artisanId) || null;
    return res.status(201).json({
      message: "Artisan created.",
      artisan,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/artisans/:id", async (req, res, next) => {
  try {
    const artisanId = await updateAdminArtisan(req.params.id, req.body || {});
    const artisans = await getAdminArtisans();
    const artisan = artisans.find((item) => item.id === artisanId) || null;
    return res.status(200).json({
      message: "Artisan updated.",
      artisan,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/artisans/:id", async (req, res, next) => {
  try {
    await deleteAdminArtisan(req.params.id);
    return res.status(200).json({ message: "Artisan deleted." });
  } catch (error) {
    return next(error);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await getAdminCategories();
    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
});

router.post("/categories", async (req, res, next) => {
  try {
    const categoryId = await createAdminCategory(req.body || {});
    const categories = await getAdminCategories();
    const category = categories.find((item) => item.id === categoryId) || null;
    return res.status(201).json({
      message: "Category created.",
      category,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/categories/:id", async (req, res, next) => {
  try {
    const categoryId = await updateAdminCategory(req.params.id, req.body || {});
    const categories = await getAdminCategories();
    const category = categories.find((item) => item.id === categoryId) || null;
    return res.status(200).json({
      message: "Category updated.",
      category,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/categories/:id", async (req, res, next) => {
  try {
    await deleteAdminCategory(req.params.id);
    return res.status(200).json({ message: "Category deleted." });
  } catch (error) {
    return next(error);
  }
});

router.get("/districts", async (_req, res, next) => {
  try {
    const districts = await getAdminDistricts();
    return res.status(200).json({ districts });
  } catch (error) {
    return next(error);
  }
});

router.post("/districts", async (req, res, next) => {
  try {
    const districtId = await createAdminDistrict(req.body || {});
    const districts = await getAdminDistricts();
    const district = districts.find((item) => item.id === districtId) || null;
    return res.status(201).json({
      message: "District created.",
      district,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/districts/:id", async (req, res, next) => {
  try {
    const districtId = await updateAdminDistrict(req.params.id, req.body || {});
    const districts = await getAdminDistricts();
    const district = districts.find((item) => item.id === districtId) || null;
    return res.status(200).json({
      message: "District updated.",
      district,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/districts/:id", async (req, res, next) => {
  try {
    await deleteAdminDistrict(req.params.id);
    return res.status(200).json({ message: "District deleted." });
  } catch (error) {
    return next(error);
  }
});

router.get("/settings", async (_req, res, next) => {
  try {
    const settings = await getAdminSettings();
    return res.status(200).json({ settings });
  } catch (error) {
    return next(error);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const settings = await updateAdminSettings(req.body || {});
    return res.status(200).json({
      message: "Settings updated.",
      settings,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/artisan-applications", async (req, res, next) => {
  try {
    const applications = await listArtisanApplications({
      status: req.query?.status,
    });
    return res.status(200).json({ applications });
  } catch (error) {
    return next(error);
  }
});

router.patch("/artisan-applications/:id/approve", async (req, res, next) => {
  try {
    const application = await approveArtisanApplication(req.params.id, req.user.id);
    return res.status(200).json({
      message: "Artisan application approved.",
      application,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/artisan-applications/:id/reject", async (req, res, next) => {
  try {
    const application = await rejectArtisanApplication(
      req.params.id,
      req.user.id,
      req.body?.reason
    );
    return res.status(200).json({
      message: "Artisan application rejected.",
      application,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
