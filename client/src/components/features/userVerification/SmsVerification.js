import { useState, useEffect } from "react";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import { auth } from "../../../config/firebaseConfig"; // Import Firebase config
import { useUser } from "../../../contexts/UserContext";
import { updateUser } from "../../../services/userService";
import PhoneInput from "react-phone-input-2";
import OtpInput from "otp-input-react";
import "react-phone-input-2/lib/style.css";
import { CgSpinner } from "react-icons/cg"; // Import spinner icon
import "../../../styles/components/userVerification/SmsVerification.css";

const PhoneVerification = () => {
  const { user } = useUser();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [error, setError] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);

  // Setup reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
    }
  };

  useEffect(() => {
    setupRecaptcha(); // Ensure reCAPTCHA is set up when the component mounts
  }, []);

  const handlePhoneChange = (value) => {
    setPhoneNumber(value);
    if (value.length === 11) {
      sendOtp(value);
    }
  };

  const handleOtpChange = (otpValue) => {
    setOtp(otpValue);
    if (otpValue.length === 6) {
      verifyOtpAndLink(otpValue);
    }
  };

  // Send OTP
  const sendOtp = async (number) => {
    setLoading(true);
    console.log(number);

    // Send an alert if the phone number is not a US-based phone number
    if (!number.startsWith("1")) {
      alert("Please enter a US-based phone number.");
      setLoading(false); // Ensure loading is set to false
      return;
    }

    if (number.length < 11) {
      alert("Enter a valid phone number.");
      setLoading(false); // Ensure loading is set to false
      return;
    }

    try {
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = `+${number}`; // Assuming the phone number is already in the correct format

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier
      );
      setVerificationId(confirmationResult.verificationId);
      setShowOTP(true);
    } catch (err) {
      setError(err.message);
      console.error("Error sending OTP:", err);
    } finally {
      setLoading(false); // Ensure loading is set to false
    }
  };

  // Verify OTP and link to existing account
  const verifyOtpAndLink = async (otpValue) => {
    if (otpValue.length === 6 && verificationId) {
      try {
        const credential = PhoneAuthProvider.credential(
          verificationId,
          otpValue
        );
        const currentUser = getAuth().currentUser; // Get the logged-in user

        if (!currentUser) {
          alert("You must be logged in to link a phone number.");
          return;
        }

        await linkWithCredential(currentUser, credential);
        await updateUser(user.mongoUserId, {
          phoneNumber: phoneNumber,
          smsVerificationStatus: "verified",
        });
        window.location.reload();
      } catch (err) {
        alert("Invalid OTP or phone number is already linked to another account. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    window.location.reload(); // Refresh the page
  };

  return (
    <div className="sms-verification-container">
      <div className="sms-verification-card">
        <h2 className="sms-verification-title">SMS Verification</h2>
        {!showOTP ? (
          <>
            <label className="sms-verification-label">
              Enter Your Phone Number
            </label>
            <br />
            <br />
            <div className="sms-verification-input-container">
              <PhoneInput
                country={"us"}
                value={phoneNumber}
                onChange={handlePhoneChange}
                inputClass="sms-verification-input"
                buttonClass="sms-verification-country-button"
              />
              {loading && <CgSpinner size={24} className="loading-spinner" />}
            </div>
            <br />
            {loading && (
              <>
                <br />
                <CgSpinner size={48} className="loading-spinner" />
              </>
            )}
          </>
        ) : (
          <>
            <label className="sms-verification-label">Enter your OTP</label>
            <br />
            <br />
            <OtpInput
              value={otp}
              onChange={handleOtpChange}
              OTPLength={6}
              otpType="number"
              disabled={false}
              autoFocus
              className="opt-container"
            />
            <br />
            <button className="sms-verification-button" onClick={handleCancel}>
              Cancel
            </button>
          </>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
};

export default PhoneVerification;
