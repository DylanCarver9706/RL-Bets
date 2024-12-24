import { getFirebaseIdToken } from "./firebaseService.js";

const BASE_URL = process.env.REACT_APP_BASE_SERVER_URL; // Define your backend server URL

// Function to create a new user in the MongoDB database
export const createUserInDatabase = async (name, email, firebaseUserId) => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_URL}/api/users`, {
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
        idvStatus: "unverified",
        emailVerificationStatus: "unverified",
        userType: "user",
        accountStatus: "active",
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

    const response = await fetch(`${BASE_URL}/api/users/firebase/${firebaseUserId}`, {
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

// Get all users
export const getUsers = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch user's data.");
    }

    return data; // Return the user data
  } catch (err) {
    console.error("Error fetching users:", err.message);
    throw err;
  }
};

// Get a user by their MongoDB ID
export const getUserById = async (userId) => {
    try {

      const idToken = await getFirebaseIdToken();

      const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Include the token in the headers
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user data.");
      }
  
      return data; // Return the user data
    } catch (err) {
      console.error("Error fetching user by ID:", err.message);
      throw err;
    }
  };
  
// Update a user by their MongoDB ID
  export const updateUser = async (userId, updatedData) => {
    try {

      const idToken = await getFirebaseIdToken();

      const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
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

      const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
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

    const response = await fetch(`${BASE_URL}/api/users/soft_delete/${mongoUserId}`, {
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

    const response = await fetch(`${BASE_URL}/api/create-checkout-session`, {
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

// Get all logs
export const getLogs = async () => {
  try {

    const idToken = await getFirebaseIdToken();

    const response = await fetch(`${BASE_URL}/api/logs`, {
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

  const { latitude, longitude } = position.coords;
  console.log("Position:", position);
  console.log(
    "User's Coordinates ('Latitude','Longitude'):",
    `${latitude},${longitude}`
  );

  return position;
};

export const getUserStateByLatLon = async (lat, lon) => {
  try {
    // Retrieve the Firebase ID token
    const idToken = await getFirebaseIdToken();

    // Make the fetch request to your backend API
    const response = await fetch(
      `${BASE_URL}/api/reverse-geocode`,
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
    console.log("Is Valid State:", reverseGeocodeResponse?.allowed);

    let response = {allowed: reverseGeocodeResponse?.allowed, state: reverseGeocodeResponse?.state} 
    
    // Check if the user is in an allowed state
    if (reverseGeocodeResponse?.allowed) {
      console.log("Access granted: User is in an allowed state.");
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

    console.log("Initial permission state:", permissionStatus.state);

    if (permissionStatus.state === "denied") {
      console.log("Geolocation permission denied.");
      return false;
    }

    if (permissionStatus.state === "prompt") {
      console.log("Geolocation permission prompt active...");
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
      console.log("Geolocation permission granted.");
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
    `${BASE_URL}/api/check-legal-age`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`, // Include the token in the headers
      },
      body: JSON.stringify({ state, DOB }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to validate age.");
  }

  return data.isAllowed; // Return the validation result
  } catch (err) {
    console.error("Error validating age:", err.message);
    throw err;
  }
}