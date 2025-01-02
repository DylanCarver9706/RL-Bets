// app/services/userService.js
const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { getSocketIo } = require("../middlewares/socketIO");
const { sendEmail } = require("../middlewares/nodemailer");

const getAllUsers = async () => {
  return await collections.usersCollection.find().toArray();
};

const getUserById = async (id) => {
  return await collections.usersCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const getUserByFirebaseId = async (firebaseUserId) => {
  return await collections.usersCollection.findOne({ firebaseUserId });
};

const createUser = async (userData) => {
  // Check if a user with the provided email exists and has been deleted
  const existingUser = await collections.usersCollection.findOne({
    email: userData.email,
    // accountStatus: "deleted",
  });

  if (existingUser) {
    return await updateMongoDocument(
      collections.usersCollection,
      existingUser._id.toString(),
      { $set: { ...userData, accountStatus: "active" } },
      true
    );
  }

  await sendEmail(
    userData.email,
    "Welcome to RL Bets",
    `Hello ${userData.name},\n\nWelcome to RL Bets! We're excited to have you on board. Your account is now active, and you can start using our services right away.\n\nIf you have any questions or need assistance, please don't hesitate to reach out to our support team.\n\nBest regards,\nThe RL Bets Team`
  );

  return await createMongoDocument(collections.usersCollection, userData, true);
};

const updateUser = async (id, updateData) => {
  await updateMongoDocument(collections.usersCollection, id, {
    $set: updateData,
  });

  const updatedUser = await collections.usersCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });

  // Emit WebSocket updates
  const allUsers = await getAllUsers();
  const io = getSocketIo();
  io.emit("updateUser", updatedUser);
  io.emit("updateUsers", allUsers);

  return updatedUser;
};

const softDeleteUser = async (id) => {
  await updateMongoDocument(collections.usersCollection, id, {
    $set: {
      name: null,
      firebaseUserId: null,
      credits: 0.0,
      earnedCredits: 0.0,
      idvStatus: "unverified",
      emailVerificationStatus: "unverified",
      accountStatus: "deleted",
      DOB: null,
    },
  });

  const updatedUser = await collections.usersCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });

  // Emit WebSocket updates
  const allUsers = await getAllUsers();
  const io = getSocketIo();
  io.emit("updateUser", updatedUser);
  io.emit("updateUsers", allUsers);
};

const deleteUser = async (id) => {
  const result = await collections.usersCollection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  if (result.deletedCount === 0) throw new Error("User not found");
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
