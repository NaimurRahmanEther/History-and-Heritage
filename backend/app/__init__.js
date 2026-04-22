const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const multer = require("multer");
const config = require("./config");
const { requireAuth, requireAdminOrArtisan } = require("./middleware/auth");

const authRoutes = require("./routes/auth_routes");
const catalogRoutes = require("./routes/catalog_routes");
const cartRoutes = require("./routes/cart_routes");
const orderRoutes = require("./routes/order_routes");
const adminRoutes = require("./routes/admin_routes");
const artisanRoutes = require("./routes/artisan_routes");

function normalizeCorsOrigin(originValue) {
  return originValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createStorage() {
  fs.mkdirSync(config.uploadDir, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, config.uploadDir);
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname || "").toLowerCase();
      const safeExtension = extension || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
    },
  });
}

function createApp() {
  const app = express();
  const allowedOrigins = normalizeCorsOrigin(config.corsOrigin);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(morgan("dev"));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/uploads", express.static(config.uploadDir));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "traditional-market-backend",
      timestamp: new Date().toISOString(),
    });
  });

  const upload = multer({
    storage: createStorage(),
    limits: {
      fileSize: config.maxFileSizeMb * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowed.includes(file.mimetype)) {
        cb(new Error("Only jpg, png, and webp images are allowed."));
        return;
      }
      cb(null, true);
    },
  });

  app.post(
    "/api/uploads/images",
    requireAuth,
    requireAdminOrArtisan,
    upload.single("image"),
    (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required." });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      return res.status(201).json({
        message: "Image uploaded successfully.",
        url: fileUrl,
      });
    }
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/catalog", catalogRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/artisan", artisanRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  app.use((error, _req, res, _next) => {
    // PostgreSQL unique violation
    if (error && error.code === "23505") {
      return res.status(409).json({
        message: "Duplicate value violates unique constraint.",
        detail: error.detail,
      });
    }

    // PostgreSQL foreign key violation
    if (error && error.code === "23503") {
      return res.status(409).json({
        message: "Operation blocked by related records.",
        detail: error.detail,
      });
    }

    const statusCode = Number(error?.statusCode || 500);
    return res.status(statusCode).json({
      message: error?.message || "Internal server error.",
    });
  });

  return app;
}

module.exports = {
  createApp,
};
