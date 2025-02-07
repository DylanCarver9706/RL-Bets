// app/services/userService.js
const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { getSocketIo } = require("../middlewares/socketIO");
const { sendEmail } = require("../middlewares/nodemailer");
const { createUserNotificationLog } = require("./logsService");

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

  let userDoc = null;

  // Check if a user with the provided email exists and has been deleted
  const existingUser = await collections.usersCollection.findOne({
    email: userData.email,
    // accountStatus: "deleted",
  });

  if (existingUser) {
    console.log("User exists, updating account status to active");
    userDoc = await updateMongoDocument(
      collections.usersCollection,
      existingUser._id.toString(),
      { $set: { ...userData, accountStatus: "active" } },
      true
    );
  } else {
    userDoc = await createMongoDocument(collections.usersCollection, userData, true) 
  }

  await sendEmail(
    userData.email,
    "Welcome to RL Bets",
    `Hello ${userData.name},\n\nWelcome to RL Bets! We're excited to have you on board. Your account is now active, and you can start using our services right away.\n\nIf you have any questions or need assistance, please don't hesitate to reach out to our support team.\n\nBest regards,\nThe RL Bets Team`,
    null,
    null,
  );

  await createUserNotificationLog({
    user: userDoc._id.toString(),
    type: "welcome",
    message: "Welcome to RL Bets! Feel free to explore our platform and start betting on your favorite teams or players. Good luck!",
  });

  return userDoc;
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
      // email
      // mongoUserId
      credits: 0.0,
      earnedCredits: 0.0,
      lifetimeEarnedCredits: 0.0,
      firebaseUserId: null,
      // userType
      idvStatus: "unverified",
      emailVerificationStatus: "unverified",
      accountStatus: "deleted",
      DOB: null,
      referralCode: null,
      authProvider: null,
      phoneNumber: null,
      tos: null,
      pp: null,
      ageValid: null,
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

const adminEmailUsers = async (users, subject, body) => {
  // console.log("Sending email to users:", users);
  for (const user of users) {
    await sendEmail(
      user,
      subject,
      null,
      body,
      null,
    );
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
};
