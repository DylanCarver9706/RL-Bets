import React, { useState } from "react";
import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { analytics, auth } from "../firebaseConfig.js";
import {
  createUserInDatabase,
  getMongoUserDataByFirebaseId,
  updateUser,
} from "../services/userService.js";
import { Link, useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";

const Login = () => {
  const [email, setEmail] = useState("dylancarver14@gmail.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/Wagers");
    } catch (error) {
      console.error("Error during authentication:", error.message);
      setError(error.message);
    }

    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if the user exists in MongoDB
      let mongoUserFound;
      try {
        mongoUserFound = await getMongoUserDataByFirebaseId(firebaseUser.uid);
      } catch (error) {
        console.error("Error fetching MongoDB user data:", error.message);
      }

      if (!mongoUserFound) {
        // New user: Create in MongoDB
        try {
          const mongoUser = await createUserInDatabase(
            firebaseUser.displayName,
            firebaseUser.email,
            firebaseUser.uid,
            null,
            "google",
            null,
            `Accepted v0 at ${new Date().toISOString().split("T")[0]}`,
            `Accepted v0 at ${new Date().toISOString().split("T")[0]}`
          );

          // Remove referral code from local storage
          localStorage.removeItem("referralCode");

          // Log the sign-up event to Firebase Analytics
          logEvent(analytics, "sign_up", {
            method: "google",
          });

          if (!firebaseUser.emailVerified) {
            // Send Email Verification
            await sendEmailVerification(firebaseUser);
            navigate("/Email-Verification");
          } else {
            await updateUser(mongoUser._id, {
              emailVerificationStatus: "verified",
            });
            navigate("/Identity-Verification");
          }
        } catch (error) {
          console.error("Error creating new user:", error.message);
          alert("Failed to create a new user. Please try again.");
        }
      } else {
        // window.location.reload();
        navigate("/Wagers");
      }
    } catch (error) {
      console.error("Error during Google authentication:", error.message);
      alert("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div>
      <h2>New Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
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
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="checkbox"
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>

        <button disabled={loading} type="submit">
          {"Login"}
        </button>
        <Link to="/Forgot-Password">Forgot Password?</Link>
      </form>
      <button
        onClick={() => handleGoogleAuth(true)}
        style={{ marginTop: "10px" }}
      >
        Login with Google
      </button>
      <Link to="/Signup">Switch to Sign up</Link>
    </div>
  );
};
export default Login;
