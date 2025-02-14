const express = require("express");
const router = express.Router();
const betsController = require("../controllers/betsController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.post("/", verifyFirebaseToken, betsController.create);
router.get("/", verifyFirebaseToken, betsController.getAll);
router.get("/:id", verifyFirebaseToken, betsController.getById);
router.put("/:id", verifyFirebaseToken, betsController.update);
router.delete("/:id", verifyFirebaseToken, betsController.remove);

module.exports = router;
