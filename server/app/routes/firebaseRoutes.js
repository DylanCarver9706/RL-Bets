const express = require("express");
const multer = require("multer");
const firebaseController = require("../controllers/firebaseController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

const router = express.Router();

// ✅ Set up Multer for handling multiple file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 3, // Max number of files
  },
});

router.post(
  "/storage/upload",
  verifyFirebaseToken(),
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "selfieImage", maxCount: 1 },
  ]),
  firebaseController.uploadIdvDocuments
);

router.get(
  "/storage/identity-verification-images",
  verifyFirebaseToken(true),
  firebaseController.getIdentityVerificationImages
);

router.post(
  "/storage/delete",
  verifyFirebaseToken(true),
  firebaseController.deleteUserIdvFiles
);

module.exports = router;
