const BASE_URL = process.env.REACT_APP_BASE_CLIENT_URL; // Define your backend server URL

// Function to create a new user in the MongoDB database
export const createUserInDatabase = async (name, email, password, firebaseUserId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
        firebaseUserId: firebaseUserId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create user in database.");
    }

    console.log("MongoDB User ID: ", data.userId);
    return data.userId;
  } catch (err) {
    console.error("Error creating user in MongoDB:", err.message);
    throw err;
  }
};

// Function to get the MongoDB user ID by Firebase user ID
export const getMongoUserIdByFirebaseId = async (firebaseUserId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/users/firebase/${firebaseUserId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch MongoDB user ID.");
    }

    return data._id; // Return the MongoDB user ID
  } catch (err) {
    console.error("Error fetching MongoDB user ID:", err.message);
    throw err;
  }
};
