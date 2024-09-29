import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import { createUserInDatabase } from "../services/userService.js";
import { useUser } from "../context/UserContext"; 

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Sign-up
  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Test User"); // Add a name field for new users
  const navigate = useNavigate();
  const { setMongoUserId } = useUser(); // Use context function to update MongoDB user ID

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let userCredential;
      let mongoUserId;

      if (isLogin) {
        // Firebase login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Firebase sign up
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create a new user in MongoDB database
        mongoUserId = await createUserInDatabase(name, email, password, userCredential.user.uid);
        setMongoUserId(mongoUserId); // Set MongoDB User ID in context
      }

      navigate("/"); // Navigate to Home after successful login/signup
    } catch (error) {
      console.error("Error during authentication:", error.message);
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin} // Required only during sign-up
            />
          </div>
        )}
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Switch to Sign Up" : "Switch to Login"}
      </button>
    </div>
  );
};

export default Auth;
