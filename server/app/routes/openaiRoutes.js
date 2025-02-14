const express = require("express");
const multer = require("multer");
const router = express.Router();
const openaiController = require("../controllers/openaiController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// ✅ Use Memory Storage Instead of Disk
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Image Processing Route with Firebase Authentication
router.post("/analyze", verifyFirebaseToken, upload.single("image"), openaiController.processImage);

module.exports = router;
