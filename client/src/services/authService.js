import { getFirebaseIdToken } from "./firebaseService";

// Base configuration
let BASE_SERVER_URL;
if (process.env.REACT_APP_ENV === "production") {
  BASE_SERVER_URL = process.env.REACT_APP_BASE_PROD_SERVER_URL;
} else {
  BASE_SERVER_URL = process.env.REACT_APP_BASE_DEV_SERVER_URL;
}

// Helper function to make authenticated requests
export const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const idToken = await getFirebaseIdToken();

  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };

  return fetch(`${BASE_SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
};
