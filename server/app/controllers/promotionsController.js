// app/controllers/promotionsController.js
const promotionsService = require("../services/promotionsService");

const getAllPromotions = async (req, res) => {
  try {
    const promotions = await promotionsService.getAllPromotions();
    res.status(200).json(promotions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promotions", details: err.message });
  }
};

const getPromotionById = async (req, res) => {
  try {
    const promotion = await promotionsService.getPromotionById(req.params.id);
    if (!promotion) return res.status(404).json({ error: "Promotion not found" });
    res.status(200).json(promotion);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promotion", details: err.message });
  }
};

const createPromotion = async (req, res) => {
  try {
    const newPromotion = await promotionsService.createPromotion(req.body);
    res.status(201).json(newPromotion);
  } catch (err) {
    res.status(500).json({ error: "Failed to create promotion", details: err.message });
  }
};

const updatePromotion = async (req, res) => {
  try {
    const updatedPromotion = await promotionsService.updatePromotion(req.params.id, req.body);
    res.status(200).json(updatedPromotion);
  } catch (err) {
    res.status(500).json({ error: "Failed to update promotion", details: err.message });
  }
};

const deletePromotion = async (req, res) => {
  try {
    await promotionsService.deletePromotion(req.params.id);
    res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete promotion", details: err.message });
  }
};

const promotionRedemption = async (req, res) => {
    try {
      const promotionType = req.body.promotionType;
      const userId = req.body.userId;
      const meta = req.body.meta;
      await promotionsService.redeemPromotion(promotionType, userId, meta);
      res.status(201).json({ message: "Promotion redeemed successfully" });
    } catch (err) {
      console.error("Error redeeming promotion:", err.message);
      res.status(500).json({ error: "Failed to redeem promotion", details: err.message });
    }
  };

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  promotionRedemption,
};
