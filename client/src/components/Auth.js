import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import {
  createUserInDatabase,
  updateUser,
  getMongoUserDataByFirebaseId,
} from "../services/userService.js";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Test User");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let firebaseCredential;

      // Email Login
      if (isLogin) {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Reload App instead of navigating which will do the same thing
        window.location.reload();
        // Email Signup
      } else {
        firebaseCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const firebaseUser = firebaseCredential.user;

        if (!firebaseUser?.uid) {
          throw new Error("Failed to retrieve Firebase user ID.");
        }

        // Create the user in MongoDB
        const mongoUser = await createUserInDatabase(
          name,
          email,
          firebaseUser.uid
        );

        // if (providerId === "password") {
        if (!firebaseUser.emailVerified) {
          // Send Email Verification
          await sendEmailVerification(firebaseUser);

          // Reload App instead of navigating which will do the same thing
          window.location.reload();
        } else {
          await updateUser(mongoUser._id, {
            emailVerificationStatus: "verified",
          });

          // Reload App instead of navigating which will do the same thing
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error during authentication:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email to reset the password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Please check your inbox.");
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
      alert("Failed to send password reset email. Please try again.");
    }
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if the user exists in MongoDB
      let mongoUser;
      try {
        mongoUser = await getMongoUserDataByFirebaseId(firebaseUser.uid);
      } catch (error) {
        console.error("Error fetching MongoDB user data:", error.message);
      }

      // Existing user
      if (mongoUser) {
        // Reload App instead of navigating which will do the same thing
        window.location.reload();
      } else {
        // New user: Create in MongoDB
        try {
          const mongoUser = await createUserInDatabase(
            firebaseUser.displayName,
            firebaseUser.email,
            firebaseUser.uid
          );

          if (!firebaseUser.emailVerified) {
            // Send Email Verification
            await sendEmailVerification(firebaseUser);
            // Reload App instead of navigating which will do the same thing
            window.location.reload();
          } else {
            await updateUser(mongoUser._id, {
              emailVerificationStatus: "verified",
            });
            // Reload App instead of navigating which will do the same thing
            window.location.reload();
          }
        } catch (error) {
          console.error("Error creating new user:", error.message);
          alert("Failed to create a new user. Please try again.");
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error during Google authentication:", error.message);
      alert("Failed to sign in with Google. Please try again.");
      window.location.reload();
    }
  };

  return (
    <div>
      {!showForgotPassword && (
        <div>
          <h2>{isLogin ? "Login" : "Sign Up"}</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label>Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
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
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </button>
          </form>
          {isLogin && (
            <button
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
              style={{ marginTop: "10px" }}
            >
              Forgot Password
            </button>
          )}
          {isLogin && (
            <button
              onClick={() => handleGoogleAuth(true)}
              disabled={loading}
              style={{ marginTop: "10px" }}
            >
              Sign In with Google
            </button>
          )}
          {!isLogin && (
            <button
              onClick={() => handleGoogleAuth(true)}
              disabled={loading}
              style={{ marginTop: "10px" }}
            >
              Sign Up with Google
            </button>
          )}
          <button onClick={() => setIsLogin(!isLogin)} disabled={loading}>
            {isLogin ? "Switch to Sign Up" : "Switch to Login"}
          </button>
        </div>
      )}
      {showForgotPassword && (
        <div style={{ marginTop: "20px" }}>
          <h3>Reset Password</h3>
          <p>
            Enter your email address and click "Send Reset Email" to reset your
            password.
          </p>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button onClick={handleForgotPassword} disabled={loading}>
            Send Reset Email
          </button>
          <button
            onClick={() => setShowForgotPassword(false)}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Auth;
