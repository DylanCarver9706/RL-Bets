// app/routes/plaidRoutes.js
const express = require("express");
const router = express.Router();
const plaidController = require("../controllers/plaidController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.post("/idv/link-token", verifyFirebaseToken, plaidController.generateLinkToken);
router.post("/idv/complete", verifyFirebaseToken, plaidController.completeIDV);

module.exports = router;
