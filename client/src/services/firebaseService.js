import { auth } from "../firebaseConfig.js";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebaseConfig";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL;

// Get ID token from the currently authenticated user
export const getFirebaseIdToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // throw new Error("User is not authenticated");
    }
    return await currentUser.getIdToken(); // Return a fresh ID token
  } catch (error) {
    // throw new Error("Error getting Firebase ID token:", error);
  }
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    logEvent(analytics, "page_view", { page_path: location.pathname });
  }, [location]);
};

// firebaseService.js
export const sendImagesToAPI = async (formData) => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/firebase/storage/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload images to server.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading images to API:", error);
    throw error;
  }
};

export const fetchIdentityVerificationImages = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/firebase/storage/identity-verification-images`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });
    const data = await response.json();
    return data.images;
  } catch (error) {
    console.error("Error fetching images:", error);
  }
};

export const deleteUserIdvFiles = async (userId, userName) => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/firebase/storage/delete`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({ userId, userName }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete identity verification files.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting ID verification files:", error);
    throw error;
  }
};