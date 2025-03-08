import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../../../contexts/UserContext"; // Get user context
import { sendImagesToAPI } from "../../../services/firebaseService"; // API request function
import { redeemReferralCode, updateUser } from "../../../services/userService";
import "../../../styles/components/userVerification/IdentityVerification.css";
import { getDeviceInfo } from "../../../utils/deviceDetection";
import {
  formatDobDate,
  handleDobDateSubmit,
} from "../../../services/dateService";
import Spinner from "../../common/Spinner";

const documentTypes = [
  "Driver's License",
  "ID Card",
  "Passport",
  "Military ID",
  "Residency Permit Card",
  "Temporary Visa",
];

// Documents that require both front and back
const documentsWithBack = new Set([
  "Driver's License",
  "ID Card",
  "Residency Permit Card",
]);

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

const IdentityVerification = () => {
  const { user, setUser } = useUser(); // Get user object from context

  const [documentType, setDocumentType] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [inReview, setInReview] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [captureTarget, setCaptureTarget] = useState(null); // 'selfie', 'front', or 'back'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Form state for address and DOB
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  // State to track if we need to collect user info
  const [needsUserInfo, setNeedsUserInfo] = useState(false);

  const { isDesktop, isMobileBrowser } = getDeviceInfo();

  // Set review status if user has IDV in review
  useEffect(() => {
    if (user && user.idvStatus === "review") {
      setInReview(true);
    }
    if (user && (!user.address || !user.DOB)) {
      setNeedsUserInfo(true);
    }
    // eslint-disable-next-line
  }, []);

  // Start the camera when needed
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      // Store ref in a variable to use in cleanup
      const video = videoRef.current;

      // Check if MediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera access is not supported in your browser");
        setCameraActive(false);
        return;
      }

      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: captureTarget === "selfie" ? "user" : "environment",
          },
        })
        .then((stream) => {
          video.srcObject = stream;
          video.play();
        })
        .catch((err) => {
          setError("Failed to access camera. Please allow camera permissions.");
          console.error("Camera access error:", err);
          setCameraActive(false);
        });

      // Cleanup function
      return () => {
        if (video && video.srcObject) {
          video.srcObject
            .getTracks()
            .forEach((track) => track.stop());
        }
      };
    }
  }, [cameraActive, captureTarget]);

  // Capture image from the camera preview
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `${captureTarget}.jpg`, {
          type: "image/jpeg",
        });

        if (captureTarget === "selfie") setSelfieImage(capturedFile);
        if (captureTarget === "front") setFrontImage(capturedFile);
        if (captureTarget === "back") setBackImage(capturedFile);
      }
    }, "image/jpeg");

    stopCamera();
  };

  // Stop the camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setCaptureTarget(null);
  };

  // Handle file selection for document upload
  const handleFileChange = (e, setImage) => {
    if (e.target.files.length > 0) {
      setImage(e.target.files[0]);
      setError(null);
      setSuccessMessage("");
    }
  };

  // Helper function to handle camera button clicks
  const handleCameraClick = (target) => {
    // Check if MediaDevices API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported in your browser");
      return;
    }

    if (cameraActive) {
      stopCamera();
    }

    // Small delay to ensure camera is fully stopped before restarting
    setTimeout(() => {
      setCameraActive(true);
      setCaptureTarget(target);
    }, 100);
  };

  const renderCameraOptions = (target, setImageFunction, currentImage) => {

    // For selfie - all platforms use camera
    if (target === "selfie" && isDesktop) {
      return (
        <div className="file-upload-container">
          <button
            onClick={() => handleCameraClick(target)}
            className="identity-verification-button"
          >
            Take a Picture
          </button>
        </div>
      );
    }

    // For documents - desktop gets file picker, mobile gets camera
    if (isDesktop) {
      return (
        <div className="file-upload-container">
          <button
            onClick={() => handleCameraClick(target)}
            className="identity-verification-button"
          >
            Take a Picture
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, setImageFunction)}
            style={{ display: "none" }}
            id={`${target}Input`}
            onClick={() => stopCamera()}
          />
          <label
            htmlFor={`${target}Input`}
            className="identity-verification-button"
          >
            Choose File
          </label>
        </div>
      );
    }

    // Mobile browsers get camera-only option for documents
    if (isMobileBrowser) {
      return (
        <div className="file-upload-container">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileChange(e, setImageFunction)}
            style={{ display: "none" }}
            id={`${target}Input`}
            onClick={() => stopCamera()}
          />
          <label
            htmlFor={`${target}Input`}
            className="identity-verification-button"
          >
            Take Picture
          </label>
        </div>
      );
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!documentType) {
      setError("Please select a document type.");
      return;
    }

    if (!frontImage) {
      setError("Please upload or capture the front of the document.");
      return;
    }

    if (documentsWithBack.has(documentType) && !backImage) {
      setError("Please upload or capture the back of the document.");
      return;
    }

    if (!selfieImage) {
      setError("Please take a selfie.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("userId", user.mongoUserId);
      formData.append("frontImage", frontImage);
      if (documentsWithBack.has(documentType)) {
        formData.append("backImage", backImage);
      }
      formData.append("selfieImage", selfieImage);

      await sendImagesToAPI(formData);
      await updateUser(user.mongoUserId, { idvStatus: "review" });
      setUser({
        ...user,
        idvStatus: "review",
      });
      setInReview(true);

      // If user has a referral code, redeem it
      if (user.referralCode !== "") {
        await redeemReferralCode(
          "Referred User",
          user.mongoUserId,
          user.referralCode
        );
      }
    } catch (apiError) {
      setError("Failed to send images to API.");
      console.error("Upload error:", apiError);
    }

    setUploading(false);
    setFrontImage(null);
    setBackImage(null);
    setSelfieImage(null);
  };

  const handleUserInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(user.mongoUserId, {
        address: {
          address1,
          address2,
          city,
          state,
          zip,
        },
        DOB: formattedDate,
      });
      setUser({
        ...user,
        address: {
          address1,
          address2,
          city,
          state,
          zip,
        },
        DOB: formattedDate,
      });
      setNeedsUserInfo(false);
    } catch (error) {
      setError("Failed to update user information");
      console.error("Error updating user info:", error);
    }
  };

  return (
    <div className="identity-verification-container">
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      {needsUserInfo && (
        <div className="identity-verification-card">
          <h2 className="identity-verification-title">
            Additional Information Required
          </h2>

          <form className="auth-form" onSubmit={handleUserInfoSubmit}>
            <div className="form-group">
              <label>Address Line 1:</label>
              <input
                type="text"
                className="form-input"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="Street Address"
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
                placeholder="Apt, Suite, etc. (optional)"
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
                required
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
              <div className="idv-submit-button-container">
                {uploading ? (
                  <Spinner pageLoad={false} />
                ) : (
                  <button
                    className="auth-button"
                    disabled={uploading}
                    type="submit"
                  >
                    Sign Up
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
      {inReview && (
        <div className="identity-verification-card">
          <h4 className="identity-verification-title">
            Your identity verification is currently under review
          </h4>
          <p>You will receive an email when your account has been verified.</p>
          <p>
            Refresh the page if you have received your email stating your
            account has been verified.
          </p>
        </div>
      )}
      {!inReview && !needsUserInfo && (
        <div className="identity-verification-card">
          <h3 className="identity-verification-title">
            Upload Identity Verification Documents
          </h3>
          <div>
            <label>Document Type: </label>
            <select
              value={documentType}
              onChange={(e) => {
                setDocumentType(e.target.value);
                setFrontImage(null);
                setBackImage(null);
                setSelfieImage(null);
              }}
              className="form-input"
              disabled={cameraActive}
            >
              <option value="">Select Document Type</option>
              {documentTypes.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>

          {documentType !== "" && (
            <>
              <div className="document-section">
                <label>Front of Document:</label>

                {(!cameraActive || captureTarget !== "front") &&
                  renderCameraOptions("front", setFrontImage, frontImage)}
                {frontImage && <p>Front completed!</p>}
                {cameraActive && captureTarget === "front" && (
                  <div>
                    <video
                      ref={videoRef}
                      autoPlay
                      className="idv-video-preview"
                    ></video>
                    <div className="idv-camera-controls">
                      <button
                        onClick={captureImage}
                        className="identity-verification-button"
                      >
                        Capture
                      </button>
                      <button
                        onClick={stopCamera}
                        className="identity-verification-button"
                      >
                        Cancel
                      </button>
                    </div>
                    <canvas ref={canvasRef} className="idv-canvas"></canvas>
                  </div>
                )}
              </div>

              {documentsWithBack.has(documentType) && (
                <div className="document-section">
                  <label>Back of Document:</label>
                  {(!cameraActive || captureTarget !== "back") &&
                    renderCameraOptions("back", setBackImage, backImage)}
                  {backImage && <p>Back completed!</p>}
                  {cameraActive && captureTarget === "back" && (
                    <div>
                      <video
                        ref={videoRef}
                        autoPlay
                        className="idv-video-preview"
                      ></video>
                      <div className="idv-camera-controls">
                        <button
                          onClick={captureImage}
                          className="identity-verification-button"
                        >
                          Capture
                        </button>
                        <button
                          onClick={stopCamera}
                          className="identity-verification-button"
                        >
                          Cancel
                        </button>
                      </div>
                      <canvas ref={canvasRef} className="idv-canvas"></canvas>
                    </div>
                  )}
                </div>
              )}

              <div className="document-section">
                <label>Selfie:</label>
                {(!cameraActive || captureTarget !== "selfie") &&
                  renderCameraOptions("selfie", setSelfieImage, selfieImage)}
                {selfieImage && <p>Selfie completed!</p>}
                {cameraActive && captureTarget === "selfie" && (
                  <div>
                    <video
                      ref={videoRef}
                      autoPlay
                      className="idv-video-preview"
                    ></video>
                    <div className="idv-camera-controls">
                      <button
                        onClick={captureImage}
                        className="identity-verification-button"
                      >
                        Capture
                      </button>
                      <button
                        onClick={stopCamera}
                        className="identity-verification-button"
                      >
                        Cancel
                      </button>
                    </div>
                    <canvas ref={canvasRef} className="idv-canvas"></canvas>
                  </div>
                )}
              </div>
            </>
          )}
          {documentType !== "" && (
            <div className="idv-submit-button-container">
              {uploading ? (
                <Spinner pageLoad={false} />
              ) : (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="identity-verification-button"
                >
                  Submit Verification
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IdentityVerification;
