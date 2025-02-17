// app/routes/promotionsRoutes.js
const express = require("express");
const router = express.Router();
const promotionsController = require("../controllers/promotionsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.get("/", verifyFirebaseToken(true), promotionsController.getAllPromotions);
router.get("/:id", verifyFirebaseToken(true), promotionsController.getPromotionById);
router.post("/", verifyFirebaseToken(true), promotionsController.createPromotion);
router.put("/:id", verifyFirebaseToken(true), promotionsController.updatePromotion);
router.delete("/:id", verifyFirebaseToken(true), promotionsController.deletePromotion);
router.post("/promotion_redemption", verifyFirebaseToken(), promotionsController.promotionRedemption);

module.exports = router;
