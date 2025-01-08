import { auth } from "../firebaseConfig.js";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebaseConfig";

// Get ID token from the currently authenticated user
export const getFirebaseIdToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not authenticated");
  }
  return await currentUser.getIdToken(); // Return a fresh ID token
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    logEvent(analytics, "page_view", { page_path: location.pathname });
  }, [location]);
};