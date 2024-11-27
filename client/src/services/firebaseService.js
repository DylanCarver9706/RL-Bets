import { auth } from "../firebaseConfig.js";

// Get ID token from the currently authenticated user
export const getFirebaseIdToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not authenticated");
  }
  return await currentUser.getIdToken(); // Return a fresh ID token
};