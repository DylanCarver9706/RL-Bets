import { getFirebaseIdToken } from "./firebaseService.js";

const BASE_SERVER_URL = process.env.REACT_APP_BASE_SERVER_URL; // Define your backend server URL
const BASE_CLIENT_URL = process.env.REACT_APP_BASE_CLIENT_URL; // Define your frontend client URL

// Function to create a new user in the MongoDB database
export const createUserInDatabase = async (name, email, firebaseUserId, referralCode, authProvider, pp, tos) => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({
        name: name,
        email: email,
        firebaseUserId: firebaseUserId,
        credits: 0.0,
        earnedCredits: 0.0,
        lifetimeEarnedCredits: 0.0,
        idvStatus: "unverified",
        emailVerificationStatus: "unverified",
        userType: "user",
        accountStatus: "active",
        referralCode: referralCode,
        authProvider: authProvider,
        tos: tos,
        pp: pp,
        ageValid: false,
        DOB: null,
        phoneNumber: null,
        smsVerificationStatus: "unverified",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create user in database.");
    }

    return data;
  } catch (err) {
    console.error("Error creating user in MongoDB:", err.message);
    throw err;
  }
};

// Function to get the MongoDB user ID by Firebase user ID
export const getMongoUserDataByFirebaseId = async (firebaseUserId) => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/users/firebase/${firebaseUserId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    const data = await response.json();

    if (data?.error === "User not found") {
      return null; // Handle "user not found" without a console log
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch MongoDB user data.");
    }

    return data; // Return the MongoDB user ID
  } catch (err) {
    console.error("Error fetching MongoDB user ID:", err.message);
    throw err;
  }
};

// Update a user by their MongoDB ID
  export const updateUser = async (userId, updatedData) => {
    try {

      const idToken = await getFirebaseIdToken();

      const response = await fetch(`${BASE_SERVER_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Include the token in the headers
        },
        body: JSON.stringify(updatedData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to update user data.");
      }
  
      return data; // Return the updated user data
    } catch (err) {
      console.error("Error updating user:", err.message);
      throw err;
    }
  };
  
// Delete a user by their MongoDB ID
  export const deleteUser = async (userId) => {
    try {

      const idToken = await getFirebaseIdToken();

      const response = await fetch(`${BASE_SERVER_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Include the token in the headers
        },
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user.");
      }
  
      return true; // Return true if successful
    } catch (err) {
      console.error("Error deleting user:", err.message);
      throw err;
    }
  };

// Soft delete a user by their MongoDB ID
// NOTE: Only keeping email to prevent abuse in future new customer promotions
export const softDeleteUser = async (mongoUserId) => {
  try {

    const response = await fetch(`${BASE_SERVER_URL}/api/users/soft_delete/${mongoUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to soft delete user.");
    }

  } catch (err) {
    console.error("Error soft deleting user:", err.message);
    throw err;
  }
};

// Function to connect to the Stripe API to make a purchase
export const createCheckoutSession = async (purchaseItems, mongoUserId, creditsTotal) => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/stripe/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({ purchaseItems, mongoUserId, creditsTotal }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Purchase Failed");
    }

    return data; // Return the session ID for Stripe checkout
  } catch (err) {
    console.error("Purchase Failed:", err.message);
    throw err;
  }
};

export const getWagers = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/wagers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch wagers.");
    }

    return data; // Return the wagers data
  } catch (err) {
    console.error("Error fetching wagers:", err.message);
    throw err;
  }
}

// Get all logs
export const getLogs = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_SERVER_URL}/api/logs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch logs.");
    }

    return data; // Return the logs data
  } catch (err) {
    console.error("Error fetching logs:", err.message);
    throw err;
  }
};

export const getUserLocation = async () => {
  // Get the user's location
  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });

  // const { latitude, longitude } = position.coords;
  // console.log(
  //   "User's Coordinates ('Latitude','Longitude'):",
  //   `${latitude},${longitude}`
  // );

  return position;
};

export const getUserStateByLatLon = async (lat, lon) => {
  try {
    // Retrieve the Firebase ID token
    const idToken = await getFirebaseIdToken();

    // Make the fetch request to your backend API
    const response = await fetch(
      `${BASE_SERVER_URL}/api/geofencing/reverse-geocode`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Include the token in the headers
        },
        body: JSON.stringify({ lat, lon }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to validate state.");
    }

    return data; // Return the validation result and address details
  } catch (err) {
    console.error("Error validating state:", err.message);
    throw err;
  }
};

export const userLocationLegal = async () => {
  if (!navigator.geolocation) {
    console.log("Geolocation is not supported by your browser.");
    return;
  }

  try {
    // Destructure the latitude and longitude from the geolocation response
    const { coords: { latitude, longitude } } = await getUserLocation();

    // Find what state the user is in
    const reverseGeocodeResponse = await getUserStateByLatLon(latitude, longitude);
    console.log("reverseGeocodeResponse:", reverseGeocodeResponse);

    let response = {allowed: reverseGeocodeResponse?.allowed, state: reverseGeocodeResponse?.state} 
    
    // Check if the user is in an allowed state
    if (reverseGeocodeResponse?.allowed) {
      return response;
    } else {
      console.log("Access denied: Sports gambling is not allowed in your location.");
      return response;
    }
  } catch (error) {
    console.error("Error checking user location:", error.message);
    console.log("Unable to determine your location. Location access is required.");
  }
};

export const checkGeolocationPermission = async () => {
  if (!navigator.permissions) {
    alert("Permissions API is not supported in this browser.");
    return false;
  }

  try {
    const permissionStatus = await navigator.permissions.query({ name: "geolocation" });

    if (permissionStatus.state === "denied") {
      console.log("Geolocation permission denied.");
      return false;
    }

    if (permissionStatus.state === "prompt") {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        console.log("Geolocation access granted after prompt.");
        return true;
      } catch (error) {
        console.log("Geolocation access denied after prompt.");
        return false;
      }
    }

    if (permissionStatus.state === "granted") {
      return true;
    }
  } catch (error) {
    console.error("Error checking geolocation permission:", error);
    return false;
  }
};

export const userAgeLegal = async (state, DOB) => {
  try {
  // Retrieve the Firebase ID token
  const idToken = await getFirebaseIdToken();

  // Make the fetch request to your backend API
  const response = await fetch(
    `${BASE_SERVER_URL}/api/age-restriction/check-legal-age`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({ state, DOB }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to validate age.");
  }
  
  const data = await response.json();

  return data.isAllowed; // Return the validation result
  } catch (err) {
    console.error("Error validating age:", err.message);
    return false;
  }
}

export const redeemReferralCode = async (promotionType, userId, referralCode = null) => {
  try {
    // Retrieve the Firebase ID token
    const idToken = await getFirebaseIdToken();

    let meta = {};

    if (promotionType === "Referred User") {
      meta = { existingUserId: referralCode };
    }

    // Make the fetch request to your backend API
    const response = await fetch(`${BASE_SERVER_URL}/api/promotions/promotion_redemption`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({ promotionType, userId, meta }),
    });
    if (!response.ok) {
      throw new Error("Failed to redeem referral code.");
    }
  } catch (err) {
    console.error("Error redeeming referral code:", err.message);
    return false;
  }
};

export const generateReferralCode = async (userId) => {
  try {
    return `${BASE_CLIENT_URL}/Signup?ref=${userId}`;
  } catch (err) {
    throw new Error("Error generating referral code:", err.message);
  }
}

export const fetchTransactionHistory = async (userId) => {
  try {
    // Retrieve the Firebase ID token
    const idToken = await getFirebaseIdToken();
    const response = await fetch(`${BASE_SERVER_URL}/api/transactions/user/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Include the token in the headers
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch transaction history.");
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching transaction history:", err.message);
    return [];
  }
}

export const fetchUserNotificationLogs = async (userId) => {
  try {
    // Retrieve the Firebase ID token
    const idToken = await getFirebaseIdToken();
    const response = await fetch(`${BASE_SERVER_URL}/api/logs/notifications/user/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Include the token in the headers
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user notification logs.");
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching user notification logs:", err.message);
    return [];
  }
}

export const dismissNotification = async (notificationId) => {
  try {
    // Retrieve the Firebase ID token
    const idToken = await getFirebaseIdToken();
    const response = await fetch(`${BASE_SERVER_URL}/api/logs/${notificationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({ cleared: true }),
    });
    if (!response.ok) {
      throw new Error("Failed to dismiss notification.");
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error dismissing notification:", err.message);
    return false;
  }
}

export const wait = async (timeInMs) => {
  return new Promise((resolve) => setTimeout(resolve, timeInMs));
};

export const formatDateToUserTimezone = (timestamp) => {
  // Parse the raw timestamp as if it's in Central Time (manually specify the offset)
  const centralTimeOffsetInMs = parseInt(process.env.REACT_APP_UTC_TIMEZONE_OFFSET) * 60 * 60 * 1000; // CST offset is UTC-6
  const parsedDate = new Date(timestamp); // Parse as-is
  const adjustedDate = new Date(parsedDate.getTime() + centralTimeOffsetInMs); // Adjust for Central Time

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format the date in the user's timezone
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h12', // Use 12-hour clock for AM/PM
    timeZone: userTimezone, // Convert to user's local timezone
  }).format(adjustedDate);

  return formattedDate;
};

export const getTimestamp = () => {
  const now = new Date();

  // Get the offset for CST in minutes (-360 minutes for CST)
  const offset = -parseInt(process.env.REACT_APP_UTC_TIMEZONE_OFFSET) * 60; // CST offset is UTC-6
  const localDate = new Date(now.getTime() + offset * 60 * 1000);

  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(localDate.getUTCDate()).padStart(2, "0");
  const hour = String(localDate.getUTCHours()).padStart(2, "0");
  const minute = String(localDate.getUTCMinutes()).padStart(2, "0");
  const second = String(localDate.getUTCSeconds()).padStart(2, "0");
  // console.log(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
};