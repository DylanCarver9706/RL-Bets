// app/services/firebase.js
const firebaseAdmin = require("firebase-admin");
const firebaseServiceAccountKey = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

const initializeFirebase = async () => {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseServiceAccountKey),
  });
};

module.exports = { initializeFirebase, firebaseAdmin };