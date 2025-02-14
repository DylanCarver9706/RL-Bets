const express = require("express");
const router = express.Router();
const wagersController = require("../controllers/wagersController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.get("/", verifyFirebaseToken, wagersController.getAll);
router.get("/:id", verifyFirebaseToken, wagersController.getById);
router.post("/", verifyFirebaseToken, wagersController.create);
router.put("/:id", verifyFirebaseToken, wagersController.update);
router.delete("/:id", verifyFirebaseToken, wagersController.remove);
router.delete("/", verifyFirebaseToken, wagersController.removeAll);

module.exports = router;
