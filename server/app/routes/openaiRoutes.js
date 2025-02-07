const express = require("express");
const multer = require("multer");
const { processImage } = require("../controllers/openaiController");

const router = express.Router();

// ✅ **Use Memory Storage Instead of Disk**
const upload = multer({ storage: multer.memoryStorage() });

// ✅ **Image Processing Route**
router.post("/analyze", upload.single("image"), processImage);

module.exports = router;

