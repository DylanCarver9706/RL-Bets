// app/controllers/userController.js
const userService = require("../services/usersService");

const getAllUsers = async (req, res, logError) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    logError(error);
  }
};

const getUserById = async (req, res, logError) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    logError(error);
  }
};

const getUserByFirebaseId = async (req, res, logError) => {
  try {
    const user = await userService.getUserByFirebaseId(
      req.params.firebaseUserId
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    logError(error);
  }
};

const createUser = async (req, res, logError) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    logError(error);
  }
};

const updateUser = async (req, res, logError) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    res.status(200).json(updatedUser);
  } catch (error) {
    logError(error);
  }
};

const softDeleteUser = async (req, res, logError) => {
  try {
    await userService.softDeleteUser(req.params.id);
    res.status(200).json({ message: "User soft-deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

const deleteUser = async (req, res, logError) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

const adminEmailUsers = async (req, res, logError) => {
  try {
    await userService.adminEmailUsers(
      req.body.users,
      req.body.subject,
      req.body.body
    );
    res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    logError(error);
  }
};

const identityVerificationComplete = async (req, res, logError) => {
  try {
    await userService.sendIdentityVerificationResults(req.body);
    res.status(200).json({ message: "Identity verification results updated" });
  } catch (error) {
    logError(error);
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
  adminEmailUsers,
  identityVerificationComplete,
};
