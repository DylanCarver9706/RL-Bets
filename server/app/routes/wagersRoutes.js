const express = require("express");
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  remove,
  removeAll,
} = require("../controllers/wagersController");
const { verifyFirebaseToken } = require("../middlewares/firebaseAdmin");

router.get("/", verifyFirebaseToken, getAll);
router.get("/:id", verifyFirebaseToken, getById);
router.post("/", verifyFirebaseToken, create);
router.put("/:id", verifyFirebaseToken, update);
router.delete("/:id", verifyFirebaseToken, remove);
router.delete("/", verifyFirebaseToken, removeAll);

module.exports = router;
