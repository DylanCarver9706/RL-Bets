import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserById,
  updateUser,
  deleteUser,
} from "../services/userService.js";
import { useAuth } from "../context/AuthContext.js";
import { deleteUser as firebaseDeleteUser, signOut } from "firebase/auth"; // Import Firebase deleteUser function
import { auth } from "../firebaseConfig.js";

const User = () => {
  const [user, setUser] = useState(null); // State to hold the user data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { firebaseUser } = useAuth(); // Get MongoDB ID and Firebase user from context
  const navigate = useNavigate();

  // Fetch the user data on component mount
  useEffect(() => {
    if (firebaseUser) {
      fetchUserDetails(firebaseUser.mongoUserId);
    }
  }, [firebaseUser]);

  // Fetch user details using the provided MongoDB User ID
  const fetchUserDetails = async (userId) => {
    try {
      const userData = await getUserById(userId);
      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
      setPassword(userData.password); // Set password to empty
    } catch (err) {
      console.error("Error fetching user data:", err.message);
    }
  };

  // Handle updating the user information
  const handleUpdate = async () => {
    try {
      const updatedUser = await updateUser(firebaseUser.mongoUserId, {
        name,
        email,
        password,
      });
      setUser(updatedUser);
      alert("User updated successfully");
    } catch (err) {
      console.error("Error updating user data:", err.message);
    }
  };

  // Handle deleting the user from Firebase and MongoDB
  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        // Delete user from MongoDB
        await deleteUser(firebaseUser.mongoUserId);

        // Delete Firebase user if present
        if (firebaseUser) {
          await firebaseDeleteUser(firebaseUser);
          alert("User deleted successfully from Firebase and MongoDB.");
        } else {
          alert("User deleted successfully from MongoDB.");
        }

        navigate("/Auth"); // Redirect to Auth after account deletion
      } catch (err) {
        console.error("Error deleting user account:", err.message);
        alert("Error deleting user account. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase sign-out
      navigate("/Auth"); // Redirect to Auth after logout
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <div>
      <h2>User Profile</h2>
      <h3>Mongo ID: {firebaseUser.mongoUserId}</h3>
      <h3>Firebase ID: {firebaseUser.uid}</h3>
      {user ? (
        <div>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              //   type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <p>Credits: {user.credits}</p>
          <p>Earned Credits: {user.earnedCredits}</p>
          <button onClick={handleUpdate}>Update User</button>
          <button onClick={handleDelete} style={{ marginLeft: "10px" }}>
            Delete User
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
};

export default User;
