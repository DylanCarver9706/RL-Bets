import { useState } from "react";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import Firebase config
import { useUser } from "../contexts/UserContext.js";
import { updateUser } from "../services/userService";

const PhoneVerification = () => {
  const { user, setUser } = useUser();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [error, setError] = useState("");

  // ✅ Step 1: Setup reCAPTCHA correctly
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => console.log("Recaptcha verified!", response),
        "expired-callback": () => console.error("Recaptcha expired. Please refresh."),
      });
    }
  };

  // ✅ Step 2: Send OTP (without signing in)
  const sendOtp = async () => {

    if (!phoneNumber) {
      alert("Enter a valid phone number.");
      return;
    }

    setupRecaptcha();

    try {
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = `+1${phoneNumber}`; // Assuming US numbers

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setVerificationId(confirmationResult.verificationId);
      alert("OTP sent! Check your phone.");
    } catch (err) {
      setError(err.message);
      console.error("Error sending OTP:", err);
    }
  };

  // ✅ Step 3: Verify OTP & Link to Existing Firebase Account
  const verifyOtpAndLink = async () => {

    if (!otp || !verificationId) {
        alert("Invalid OTP or verification ID.");
      return;
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const currentUser = getAuth().currentUser; // Get the logged-in user

      if (!currentUser) {
        alert("You must be logged in to link a phone number.");
        return;
      }

      await linkWithCredential(currentUser, credential);
      setUser({ ...user, phoneNumber: phoneNumber, smsVerificationStatus: "verified" });
      await updateUser(user.mongoUserId, { phoneNumber, smsVerificationStatus: "verified" });
      alert("Phone number linked successfully!");
    } catch (err) {
      alert("Invalid OTP or linking failed. Please try again.");
      throw new Error("Error linking phone number:", err);
    }
  };

  return (
    <div>
      <h2>Phone Number Verification (Link to Existing Account)</h2>

      <div>
        <input
          type="text"
          placeholder="Enter phone number (234567890)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={{ width: "300px" }}
        />
        <button onClick={sendOtp}>Send OTP</button>
      </div>

      {verificationId && (
        <div>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOtpAndLink}>Verify & Link</button>
        </div>
      )}

      <div id="recaptcha-container"></div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default PhoneVerification;
