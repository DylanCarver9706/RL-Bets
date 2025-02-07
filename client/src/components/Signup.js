import React, { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import {
  createUserInDatabase,
  updateUser,
  getMongoUserDataByFirebaseId,
  formatDateToUserTimezone,
  getTimestamp,
} from "../services/userService.js";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebaseConfig";
import Tooltip from "./ToolTip.js";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("password123");
  const [confirmPassword, setConfirmPassword] = useState("password123");
  const [name, setName] = useState("Test User");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [tosClicked, setTosClicked] = useState(false);
  const [ppClicked, setPpClicked] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [ppChecked, setPpChecked] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Check if passwords match
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    // Check if user has agreed to TOS and PP
    if (!tosChecked || !ppChecked) {
      setError(
        "You must read and agree to the Terms of Service and Privacy Policy."
      );
      return;
    }

    try {
      setLoading(true);
      const firebaseCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = firebaseCredential.user;

      if (!firebaseUser?.uid) {
        throw new Error("Failed to retrieve Firebase user ID.");
      }

      // Log the sign-up event to Firebase Analytics
      logEvent(analytics, "sign_up", {
        method: "email",
      });

      // Create the user in MongoDB
      const mongoUser = await createUserInDatabase(
        name,
        email,
        firebaseUser.uid,
        referralCode,
        "email"
      );

      // Remove referral code from local storage
      localStorage.removeItem("referralCode");

      // if (providerId === "password") {
      if (!firebaseUser.emailVerified) {
        // Send Email Verification
        await sendEmailVerification(firebaseUser);
      } else {
        await updateUser(mongoUser._id, {
          emailVerificationStatus: "verified",
        });
      }
      navigate("/Email-Verification");
    } catch (error) {
      console.error("Error during authentication:", error.message);
      setError(error.message);
    }

    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    try {
      // Check if user has agreed to TOS and PP
      if (!tosChecked || !ppChecked) {
        setError(
          "You must read and agree to the Terms of Service and Privacy Policy."
        );
        return;
      }

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
          let storedPrivacyPolicy = localStorage.getItem("privacyPolicy");
          let storedTermsOfService = localStorage.getItem("termsOfService");
          
          if (storedPrivacyPolicy) {
            storedPrivacyPolicy = JSON.parse(storedPrivacyPolicy);
          }
          if (storedTermsOfService) {
            storedTermsOfService = JSON.parse(storedTermsOfService);
          }

          const mongoUser = await createUserInDatabase(
            firebaseUser.displayName,
            firebaseUser.email,
            firebaseUser.uid,
            referralCode,
            "google",
            `Accepted v${mongoUserFound ? parseInt(storedPrivacyPolicy.version, 10) : ppChecked && tosChecked ? parseInt(storedPrivacyPolicy.version, 10) : "0" } at ${formatDateToUserTimezone(getTimestamp())}`,
            `Accepted v${ mongoUserFound ? parseInt(storedTermsOfService.version, 10) : ppChecked && tosChecked ? parseInt(storedTermsOfService.version, 10) : "0" } at ${formatDateToUserTimezone(getTimestamp())}`
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
          } else {
            await updateUser(mongoUser._id, {
              emailVerificationStatus: "verified",
            });
          }
        } catch (error) {
          console.error("Error creating new user:", error.message);
          alert("Failed to create a new user. Please try again.");
        }
      }
      // window.location.reload();
      navigate("/Identity-Verification");
    } catch (error) {
      console.error("Error during Google authentication:", error.message);
      alert("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div>
      <h2>New Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name (Please use the name on your form of identification):</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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

        <div>
          <label>Confirm Password:</label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <input
            type="checkbox"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </div>
        <>
          <div>
            <label>Referral Code:</label>
            <input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
            <Tooltip
              infoText={
                "Note that the credits will not be received until the user has completed both email and identity verification."
              }
            />
          </div>
          <div style={styles.agreementSection}>
            <a
              href="/Terms-Of-Service"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation
                setTosClicked(true); // Mark the link as clicked
                window.open(
                  "/Terms-Of-Service",
                  "_blank",
                  "noopener,noreferrer"
                ); // Open in a new tab
              }}
            >
              View Terms of Service
            </a>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={tosChecked}
                onChange={(e) => setTosChecked(e.target.checked)}
                disabled={!tosClicked} // Disable until the link is clicked
              />
              I agree to the Terms of Service
            </label>
          </div>
          <div style={styles.agreementSection}>
            <a
              href="/Privacy-Policy"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation
                setPpClicked(true); // Mark the link as clicked
                window.open("/Privacy-Policy", "_blank", "noopener,noreferrer"); // Open in a new tab
              }}
            >
              View Privacy Policy
            </a>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={ppChecked}
                onChange={(e) => setPpChecked(e.target.checked)}
                disabled={!ppClicked} // Disable until the link is clicked
              />
              I agree to the Privacy Policy
            </label>
          </div>
        </>

        <button disabled={loading} type="submit">
          {"Sign Up"}
        </button>
      </form>
      <button
        onClick={() => handleGoogleAuth(true)}
        style={{ marginTop: "10px" }}
      >
        Sign Up with Google
      </button>
      <Link to="/Login">Switch to Login</Link>
    </div>
  );
};
export default Signup;

const styles = {
  agreementSection: {
    marginBottom: "20px",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
    display: "block",
    marginBottom: "8px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
  },
};
