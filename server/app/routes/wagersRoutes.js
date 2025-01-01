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

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);
router.delete("/", removeAll);

module.exports = router;
