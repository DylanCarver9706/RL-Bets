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
import "../../../styles/components/userVerification/SmsVerification.css";
import Spinner from "../../common/Spinner";

const PhoneVerification = () => {
  const { user } = useUser();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [error, setError] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        console.log("reCAPTCHA verified");
      },
      "expired-callback": () => {
        console.log("reCAPTCHA expired");
        setError("reCAPTCHA expired. Please try again.");
        setLoading(false);
      },
    });

    setRecaptchaVerifier(verifier);

    // Cleanup function to clear reCAPTCHA when component unmounts
    return () => {
      verifier.clear();
    };
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
    try {
      setLoading(true);
      console.log(number);
      setError("");
      if (!recaptchaVerifier) {
        throw new Error("reCAPTCHA not initialized");
      }

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
      const formattedPhone = `+${number}`; // Assuming the phone number is already in the correct format

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier
      );

      setVerificationId(confirmationResult.verificationId);
      setShowOTP(true);
      setLoading(false);
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        await recaptchaVerifier.clear();
        const newVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
        setRecaptchaVerifier(newVerifier);
      }
      setError(error.message);
      setLoading(false);
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
        alert(
          "Invalid OTP or phone number is already linked to another account. Please try again."
        );
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
                placeholder="+1 (123) 456-7890"
                inputClass="sms-verification-input"
                buttonClass="sms-verification-country-button"
              />
            </div>
            <br />
            {loading && (
              <>
                <br />
                <Spinner pageLoad={false} />
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
