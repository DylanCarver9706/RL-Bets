import React, { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../../config/firebaseConfig";
import {
  createUserInDatabase,
  updateUser,
  getMongoUserDataByFirebaseId,
} from "../../../services/userService";
import { logEvent } from "firebase/analytics";
import { analytics } from "../../../config/firebaseConfig";
import Tooltip from "../../common/ToolTip";
import { Link, useNavigate } from "react-router-dom";
import "../../../styles/components/auth/Signup.css";
import {
  formatDobDate,
  handleDobDateSubmit,
} from "../../../services/dateService";
import Spinner from "../../common/Spinner";
import { getLatestPrivacyPolicy, getLatestTermsOfService } from "../../../services/agreementService";

const statesList = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [tosChecked, setTosChecked] = useState(false);
  const [ppChecked, setPpChecked] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
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

      // Get the latest privacy policy and terms of service
      let privacyPolicy = await getLatestPrivacyPolicy();
      let termsOfService = await getLatestTermsOfService();

      // Create the user in MongoDB
      const mongoUser = await createUserInDatabase({
        name: `${firstName} ${lastName}`,
        email: email,
        firebaseUserId: firebaseUser.uid,
        referralCode: referralCode,
        authProvider: "email",
        address: null,
        pp: {
          version: parseInt(privacyPolicy.version, 10),
          acceptedAt: new Date().toISOString(),
        },
        tos: {
          version: parseInt(termsOfService.version, 10),
          acceptedAt: new Date().toISOString(),
        },
      });

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

      // Update the user's address and date of birth
      await updateUser(mongoUser._id, {
        address: {
          address1,
          address2,
          city,
          state,
          zip,
        },
        DOB: formattedDate,
      });

      navigate("/email-verification");
    } catch (error) {
      console.error("Error during authentication:", error.message);
      setError(error.message);
    }

    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
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

          // Get the latest privacy policy and terms of service
          let privacyPolicy = await getLatestPrivacyPolicy();
          let termsOfService = await getLatestTermsOfService();

          const mongoUser = await createUserInDatabase({
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            firebaseUserId: firebaseUser.uid,
            referralCode: referralCode,
            authProvider: "google",
            address: null,
            pp: {
              version: parseInt(privacyPolicy.version, 10),
              acceptedAt: new Date().toISOString(),
            },
            tos: {
              version: parseInt(termsOfService.version, 10),
              acceptedAt: new Date().toISOString(),
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
      navigate("/sms-verification");
    } catch (error) {
      console.error("Error during Google authentication:", error.message);
      setLoading(false);
      alert("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-component">
        <h2 className="auth-header">Create Account</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="google-section">
          {loading ? (
            <Spinner pageLoad={false} />
          ) : (
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
              Sign up with Google
            </button>
          )}
        </div>

        <div className="divider-with-text">
          <span className="divider-text">or</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name:</label>
            <div className="form-input-container">
              <input
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Zen"
                name="given-name"
                autoComplete="given-name"
                required
              />
              <Tooltip infoText="Please use the name on your form of identification." />
            </div>
          </div>

          <div className="form-group">
            <label>Last Name:</label>
            <div className="form-input-container">
              <input
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Zen"
                name="family-name"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

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

          <div className="form-group">
            <label>Confirm Password:</label>
            <div className="password-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Address Line 1:</label>
            <input
              type="text"
              className="form-input"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="Address Line 1"
              required
            />
          </div>

          <div className="form-group">
            <label>Address Line 2:</label>
            <input
              type="text"
              className="form-input"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Address Line 2"
            />
          </div>

          <div className="form-group">
            <label>City:</label>
            <input
              type="text"
              className="form-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              required
            />
          </div>

          <div className="form-group">
            <label>State:</label>
            <select
              className="form-input"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Select a State</option>
              {statesList.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Zip:</label>
            <input
              type="text"
              className="form-input"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="Zip"
              required
            />
          </div>

          <div className="form-group">
            <label>Date of Birth:</label>
            <input
              type="tel"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(formatDobDate(e.target.value))}
              placeholder="MM/DD/YYYY"
              pattern="\d{2}/\d{2}/\d{4}"
              maxLength="10"
              onBlur={(e) => {
                const formatted = handleDobDateSubmit(e.target.value);
                if (formatted) setFormattedDate(formatted);
              }}
              name="bday"
              autoComplete="bday"
              required
            />
          </div>

          <div className="form-group">
            <label>Referral Code:</label>
            <input
              className="form-input"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="*Optional*"
            />
          </div>

          <div className="form-group">
            <div className="signup-agreements">
              <div className="signup-agreement-checkbox">
                <input
                  type="checkbox"
                  checked={tosChecked && ppChecked}
                  onChange={(e) => {
                    setTosChecked(e.target.checked);
                    setPpChecked(e.target.checked);
                  }}
                />
                <span>I agree to the</span>
              </div>
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="signup-agreement-link"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(
                    "/terms-of-service",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Terms of Service
              </a>
              <span> and </span>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="signup-agreement-link"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(
                    "/privacy-policy",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Privacy Policy
              </a>
            </div>
          </div>

          <div className="form-group">
            <div className="submit-button-container">
              {loading ? (
                <Spinner pageLoad={false} />
              ) : (
                <button
                  className="auth-button"
                  disabled={loading}
                  type="submit"
                >
                  Sign Up
                </button>
              )}
            </div>
          </div>
        </form>
        <div className="auth-links">
          <Link to="/login" className="auth-link">
            Already have an account? Log in now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
