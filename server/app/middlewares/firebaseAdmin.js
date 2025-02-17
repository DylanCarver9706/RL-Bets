// server/app/middlewares/firebaseAdmin.js
const firebaseAdmin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const firebaseServiceAccountKey = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
const { collections } = require("../../database/mongoCollections");

const initializeFirebase = async () => {
  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(firebaseServiceAccountKey),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
};

// ✅ Properly initialize the storage bucket
const bucket = () => getStorage().bucket();

const verifyFirebaseToken = (requireAdmin = false) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      req.user = decodedToken; // Attach the decoded token to the request

      // Check if admin access is required
      if (requireAdmin) {
        const user = await collections.usersCollection.findOne({
          firebaseUserId: decodedToken.uid,
          accountStatus: "active",
        });

        if (!user || user.userType !== "admin") {
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        req.user.isAdmin = true; // Mark user as admin
      }

      next();
    } catch (error) {
      console.error("Error verifying Firebase token:", error);
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
  };
};

module.exports = { initializeFirebase, verifyFirebaseToken, bucket };
