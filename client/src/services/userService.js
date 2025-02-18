import { makeAuthenticatedRequest } from "./authService";

// Function to create a new user in the MongoDB database
export const createUserInDatabase = async (userData) => {
  try {
    const response = await makeAuthenticatedRequest("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Failed to create user in database.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error creating user in MongoDB:", err.message);
    throw err;
  }
};

// Function to get the MongoDB user data by Firebase user ID
export const getMongoUserDataByFirebaseId = async (firebaseUserId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/users/firebase/${firebaseUserId}`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    if (data?.error === "User not found") {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch MongoDB user data.");
    }

    return data;
  } catch (err) {
    console.error("Error fetching MongoDB user data:", err.message);
    throw err;
  }
};

// Update a user by their MongoDB ID
export const updateUser = async (userId, updatedData) => {
  try {
    const response = await makeAuthenticatedRequest(`/api/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error("Failed to update user data.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error updating user:", err.message);
    throw err;
  }
};

// Delete a user by their MongoDB ID
export const deleteUser = async (userId) => {
  try {
    const response = await makeAuthenticatedRequest(`/api/users/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete user.");
    }

    return true;
  } catch (err) {
    console.error("Error deleting user:", err.message);
    throw err;
  }
};

// Soft delete a user by their MongoDB ID
// NOTE: Only keeping email to prevent abuse in future new customer promotions
export const softDeleteUserStatusUpdate = async (mongoUserId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/users/soft_delete/${mongoUserId}`,
      {
        method: "PUT",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to soft delete user.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error soft deleting user:", err.message);
    throw err;
  }
};

// Function to connect to the Stripe API to make a purchase
export const createCheckoutSession = async (
  purchaseItems,
  mongoUserId,
  userMadeFirstPurchase
) => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/stripe/create-checkout-session",
      {
        method: "POST",
        body: JSON.stringify({
          purchaseItems,
          mongoUserId,
          userMadeFirstPurchase,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Purchase Failed");
    }

    return await response.json();
  } catch (err) {
    console.error("Purchase Failed:", err.message);
    throw err;
  }
};

export const getWagers = async () => {
  try {
    const response = await makeAuthenticatedRequest("/api/wagers", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch wagers.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching wagers:", err.message);
    throw err;
  }
};

// Get all logs
export const getLogs = async () => {
  try {
    const response = await makeAuthenticatedRequest("/api/logs", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch logs.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching logs:", err.message);
    throw err;
  }
};

export const userAgeLegal = async (state, DOB) => {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/age-restriction/check-legal-age",
      {
        method: "POST",
        body: JSON.stringify({ state, DOB }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to validate age.");
    }

    const data = await response.json();
    return data.isAllowed;
  } catch (err) {
    console.error("Error validating age:", err.message);
    return false;
  }
};

export const redeemReferralCode = async (
  promotionType,
  userId,
  referralCode = null
) => {
  try {
    let meta = {};
    if (promotionType === "Referred User") {
      meta = { existingUserId: referralCode };
    }

    const response = await makeAuthenticatedRequest(
      "/api/promotions/promotion_redemption",
      {
        method: "POST",
        body: JSON.stringify({ promotionType, userId, meta }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to redeem referral code.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error redeeming referral code:", err.message);
    return false;
  }
};

export const generateReferralCode = async (userId) => {
  
  let BASE_CLIENT_URL;
  if (process.env.REACT_APP_ENV === "production") {
    BASE_CLIENT_URL = process.env.REACT_APP_BASE_PROD_CLIENT_URL;
  } else {
    BASE_CLIENT_URL = process.env.REACT_APP_BASE_DEV_CLIENT_URL;
  }

  try {
    return `${BASE_CLIENT_URL}/Signup?ref=${userId}`;
  } catch (err) {
    throw new Error("Error generating referral code:", err.message);
  }
};

export const fetchTransactionHistory = async (userId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/transactions/user/${userId}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transaction history.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching transaction history:", err.message);
    return [];
  }
};

export const fetchUserNotificationLogs = async (userId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/logs/notifications/user/${userId}`,
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user notification logs.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching user notification logs:", err.message);
    return [];
  }
};

export const dismissNotification = async (notificationId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `/api/logs/${notificationId}`,
      {
        method: "PUT",
        body: JSON.stringify({ cleared: true }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to dismiss notification.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error dismissing notification:", err.message);
    return false;
  }
};
