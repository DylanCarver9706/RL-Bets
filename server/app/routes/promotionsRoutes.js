// app/routes/promotionsRoutes.js
const express = require("express");
const router = express.Router();
const promotionsController = require("../controllers/promotionsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.get("/", verifyFirebaseToken, promotionsController.getAllPromotions);
router.get("/:id", verifyFirebaseToken, promotionsController.getPromotionById);
router.post("/", verifyFirebaseToken, promotionsController.createPromotion);
router.put("/:id", verifyFirebaseToken, promotionsController.updatePromotion);
router.delete("/:id", verifyFirebaseToken, promotionsController.deletePromotion);
router.post("/promotion_redemption", verifyFirebaseToken, promotionsController.promotionRedemption);

module.exports = router;
