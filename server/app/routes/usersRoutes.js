// app/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.get("/firebase/:firebaseUserId", userController.getUserByFirebaseId);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.put("/soft_delete/:id", userController.softDeleteUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
