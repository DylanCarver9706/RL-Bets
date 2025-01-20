const express = require("express");
const router = express.Router();
const {
  getLatestPrivacyPolicy,
  getLatestTermsOfService,
} = require("../controllers/agreementsController");

// Route to get the latest Privacy Policy
router.get("/privacy-policy/latest", getLatestPrivacyPolicy);

// Route to get the latest Terms of Service
router.get("/terms-of-service/latest", getLatestTermsOfService);

module.exports = router;
