const express = require("express");
const multer = require("multer");
const { uploadIdvDocuments, getIdentityVerificationImages, deleteUserIdvFiles } = require("../controllers/firebaseController");

const router = express.Router();

// ✅ Set up Multer for handling multiple file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post("/storage/upload", upload.fields([
  { name: "frontImage", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
  { name: "selfieImage", maxCount: 1 }
]), uploadIdvDocuments);

router.get("/storage/identity-verification-images", getIdentityVerificationImages);
router.post("/storage/delete", deleteUserIdvFiles);

module.exports = router;
