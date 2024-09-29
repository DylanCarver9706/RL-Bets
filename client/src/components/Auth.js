import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig.js"; // Import Firebase auth
import { createUserInDatabase, getMongoUserIdByFirebaseId } from "../services/userServices.js"; // Import functions

const Auth = ({ updateMongoUserId }) => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Sign-up
  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Test User"); // Add a name field for new users
  const navigate = useNavigate();

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let userCredential;
      let mongoUserId;
      if (isLogin) {
        // Firebase login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Retrieve the corresponding MongoDB user document
        mongoUserId = await getMongoUserIdByFirebaseId(userCredential.user.uid);
      } else {
        // Firebase sign up
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create a new user in MongoDB database
        mongoUserId = await createUserInDatabase(name, email, password, userCredential.user.uid);
      }

      // Pass the user ID up to App.js
      updateMongoUserId(mongoUserId);

      // Navigate to Home after successful login/signup
      navigate("/");
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
