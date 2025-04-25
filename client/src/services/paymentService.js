import { makeAuthenticatedRequest } from "./authService";

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
    if (process.env.REACT_APP_ENV === "development")
      console.error("Purchase Failed:", err.message);
    throw err;
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
    if (process.env.REACT_APP_ENV === "development")
      console.error("Error fetching transaction history:", err.message);
    return [];
  }
};
