const express = require("express");
const router = express.Router();
const ageRestrictionController = require("../controllers/ageRestrictionController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.post("/check-legal-age", verifyFirebaseToken, ageRestrictionController.handleCheckLegalAge);

module.exports = router;
