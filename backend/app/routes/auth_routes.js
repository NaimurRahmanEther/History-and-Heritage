const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  mapUser,
  updateUserProfile,
} = require("../services/auth_service");
const {
  getApplicationByUserId,
  submitArtisanApplication,
} = require("../services/artisan_application_service");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const payload = await registerUser(req.body || {});
    return res.status(201).json({
      message: "Registration successful.",
      token: payload.token,
      user: payload.user,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = await loginUser(req.body || {});
    return res.status(200).json({
      message: "Login successful.",
      token: payload.token,
      user: payload.user,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  return res.status(200).json({
    user: mapUser(req.user),
  });
});

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const user = await updateUserProfile(req.user.id, req.body || {});
    return res.status(200).json({
      message: "Profile updated.",
      user,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/artisan-application/me", requireAuth, async (req, res, next) => {
  try {
    const application = await getApplicationByUserId(req.user.id);
    return res.status(200).json({ application });
  } catch (error) {
    return next(error);
  }
});

router.post("/artisan-application", requireAuth, async (req, res, next) => {
  try {
    const application = await submitArtisanApplication(req.user, req.body || {});
    return res.status(201).json({
      message: "Artisan application submitted.",
      application,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
