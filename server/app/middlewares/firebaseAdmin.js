// server/app/middlewares/firebaseAdmin.js
const firebaseAdmin = require("firebase-admin");
const firebaseServiceAccountKey = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

const initializeFirebase = async () => {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseServiceAccountKey),
  });
  console.log("Firebase initialized")
};

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach the decoded token to the request
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { initializeFirebase, verifyFirebaseToken };
