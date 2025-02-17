const express = require("express");
const router = express.Router();
const seriesController = require("../controllers/seriesController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

// Series Routes
router.post("/", verifyFirebaseToken(true), seriesController.create);
router.get("/", verifyFirebaseToken(true), seriesController.getAll);
router.get("/:id", verifyFirebaseToken(true), seriesController.getById);
router.put("/:id", verifyFirebaseToken(true), seriesController.update);
router.delete("/:id", verifyFirebaseToken(true), seriesController.remove);

module.exports = router;
