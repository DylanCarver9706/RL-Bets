// app/controllers/userController.js
const userService = require("../services/usersService");

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user", details: err.message });
  }
};

const getUserByFirebaseId = async (req, res) => {
  try {
    const user = await userService.getUserByFirebaseId(req.params.firebaseUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user", details: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to create user", details: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body, req.app.get("io"));
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user", details: err.message });
  }
};

const softDeleteUser = async (req, res) => {
  try {
    await userService.softDeleteUser(req.params.id, req.app.get("io"));
    res.status(200).json({ message: "User soft-deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to soft delete user", details: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user", details: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByFirebaseId,
  createUser,
  updateUser,
  softDeleteUser,
  deleteUser,
};
