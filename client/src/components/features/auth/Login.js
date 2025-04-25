import React, { useState } from "react";
import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { analytics, auth } from "../../../config/firebaseConfig.js";
import {
  createUserInDatabase,
  getMongoUserDataByFirebaseId,
  updateUser,
} from "../../../services/userService.js";
import { Link, useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import "../../../styles/components/auth/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      navigate("/wagers");
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
          const mongoUser = await createUserInDatabase({
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            firebaseUserId: firebaseUser.uid,
            referralCode: null,
            authProvider: "google",
            address: null,
            pp: {
              version: 0,
              acceptedAt: new Date(),
            },
            tos: {
              version: 0,
              acceptedAt: new Date(),
            },
          });

          // Remove referral code from local storage
          localStorage.removeItem("referralCode");

          // Log the sign-up event to Firebase Analytics
          logEvent(analytics, "sign_up", {
            method: "google",
          });

          if (!firebaseUser.emailVerified) {
            // Send Email Verification
            await sendEmailVerification(firebaseUser);
            navigate("/email-verification");
          } else {
            await updateUser(mongoUser._id, {
              emailVerificationStatus: "verified",
            });
            navigate("/identity-verification");
          }
        } catch (error) {
          console.error("Error creating new user:", error.message);
          alert("Failed to create a new user. Please try again.");
        }
      } else {
        // window.location.reload();
        navigate("/wagers");
      }
    } catch (error) {
      console.error("Error during Google authentication:", error.message);
      alert("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-component">
        <h2 className="auth-header">Welcome Back</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="google-section">
          <button
            className="google-button"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 18 18">
              <path
                fill="#4285f4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              ></path>
              <path
                fill="#34a853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              ></path>
              <path
                fill="#fbbc05"
                d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
              ></path>
              <path
                fill="#ea4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              ></path>
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="divider-with-text">
          <span className="divider-text">or</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <div className="password-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <Link to="/forgot-password" className="auth-link forgot-password">
            Forgot Password?
          </Link>

          <button className="auth-button" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/signup" className="auth-link">
            Don't have an account? Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
