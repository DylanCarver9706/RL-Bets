// server/app/middlewares/firebaseAdmin.js
const firebaseAdmin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const { collections } = require("../../database/mongoCollections");

const initializeFirebase = async () => {
  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url:
          process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
      }),
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
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
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
          return res
            .status(403)
            .json({ message: "Forbidden: Admin access required" });
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
