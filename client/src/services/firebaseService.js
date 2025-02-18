import { auth, analytics } from "../config/firebaseConfig.js";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { makeAuthenticatedRequest } from "./authService";

// Get ID token from the currently authenticated user
export const getFirebaseIdToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    return await currentUser.getIdToken();
  } catch (error) {
    console.error("Error getting Firebase ID token:", error);
    return null;
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
    const response = await makeAuthenticatedRequest(
      "/api/firebase/storage/upload",
      {
        method: "POST",
        // Remove Content-Type header to let browser set it with boundary for FormData
        headers: {
          "Content-Type": undefined,
        },
        body: formData,
      }
    );

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
    const response = await makeAuthenticatedRequest(
      "/api/firebase/storage/identity-verification-images",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch identity verification images.");
    }

    const data = await response.json();
    return data.images;
  } catch (error) {
    console.error("Error fetching images:", error);
    throw error;
  }
};

export const deleteUserIdvFiles = async (userId, userName) => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/firebase/storage/delete",
      {
        method: "POST",
        body: JSON.stringify({ userId, userName }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete identity verification files.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting ID verification files:", error);
    throw error;
  }
};
