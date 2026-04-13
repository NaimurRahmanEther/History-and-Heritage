const express = require("express");
const {
  getCatalogProducts,
  getCatalogProductById,
  getCategories,
  getCategoryById,
  getDistricts,
  getDistrictById,
  getArtisans,
  getArtisanById,
} = require("../services/catalog_service");

const router = express.Router();

router.get("/products", async (req, res, next) => {
  try {
    const products = await getCatalogProducts(req.query || {});
    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const product = await getCatalogProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    return res.status(200).json({ product });
  } catch (error) {
    return next(error);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await getCategories(false);
    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
});

router.get("/categories/:id", async (req, res, next) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category || !category.active) {
      return res.status(404).json({ message: "Category not found." });
    }
    return res.status(200).json({ category });
  } catch (error) {
    return next(error);
  }
});

router.get("/districts", async (_req, res, next) => {
  try {
    const districts = await getDistricts(false);
    return res.status(200).json({ districts });
  } catch (error) {
    return next(error);
  }
});

router.get("/districts/:id", async (req, res, next) => {
  try {
    const district = await getDistrictById(req.params.id);
    if (!district || !district.active) {
      return res.status(404).json({ message: "District not found." });
    }
    return res.status(200).json({ district });
  } catch (error) {
    return next(error);
  }
});

router.get("/artisans", async (_req, res, next) => {
  try {
    const artisans = await getArtisans(false);
    return res.status(200).json({ artisans });
  } catch (error) {
    return next(error);
  }
});

router.get("/artisans/:id", async (req, res, next) => {
  try {
    const artisan = await getArtisanById(req.params.id);
    if (!artisan || !artisan.active) {
      return res.status(404).json({ message: "Artisan not found." });
    }
    return res.status(200).json({ artisan });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

