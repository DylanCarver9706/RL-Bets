import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import { useUser } from "../context/UserContext.js";

const Home = () => {
  const navigate = useNavigate();
  const { mongoUserId } = useUser(); // Get the MongoDB user ID from context

  console.log("Mongo User ID: ", mongoUserId);

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase sign-out
      navigate("/Auth"); // Redirect to Auth after logout
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  // Function to handle navigation to the User Profile page
  const goToUserProfile = () => {
    navigate("/User");
  };

  return (
    <div>
      <h2>Welcome to the Home Page, ${}</h2>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={goToUserProfile} style={{ marginLeft: "10px" }}>
        User Profile
      </button>
    </div>
  );
};

export default Home;
