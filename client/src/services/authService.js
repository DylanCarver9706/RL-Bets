import { getFirebaseIdToken } from "./firebaseService";

// Base configuration
let BASE_SERVER_URL;
if (process.env.REACT_APP_ENV === "production") {
  BASE_SERVER_URL = process.env.REACT_APP_BASE_PROD_SERVER_URL;
} else if (process.env.REACT_APP_ENV === "development") {
  BASE_SERVER_URL = process.env.REACT_APP_BASE_DEV_SERVER_URL;
}

// Helper function to make authenticated requests
export const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  try {
    const token = await getFirebaseIdToken();
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${BASE_SERVER_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
};
