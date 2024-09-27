import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig.js"; // Import Firebase auth

const Home = ({ mongoUserId }) => {
  const navigate = useNavigate();

  console.log("Mongo User ID: ", mongoUserId)

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
      <h2>Welcome to the Home Page (Protected)</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Home;
