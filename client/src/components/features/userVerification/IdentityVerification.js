import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../../../contexts/UserContext"; // Get user context
import { sendImagesToAPI } from "../../../services/firebaseService"; // API request function
import { redeemReferralCode, updateUser } from "../../../services/userService";
import "../../../styles/components/userVerification/IdentityVerification.css";

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

const IdentityVerification = () => {
  const { user } = useUser(); // Get user object from context

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

  // Set review status if user has IDV in review
  useEffect(() => {
    if (user && user.idvStatus === "review") {
      setInReview(true);
    }
  }, [user]);

  // Start the camera when needed
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        })
        .catch((err) => {
          setError("Failed to access camera. Please allow camera permissions.");
          console.error("Camera access error:", err);
        });
    }
  }, [cameraActive]);

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

  // Handle file upload
  const handleUpload = async () => {
    if (!documentType) {
      setError("Please select a document type.");
      return;
    }

    if (!frontImage) {
      setError("Please upload or take the front of the document.");
      return;
    }

    if (documentsWithBack.has(documentType) && !backImage) {
      setError("Please upload or take the back of the document.");
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

      // If user has a referral code, redeem it
      if (user.referralCode !== "") {
        await redeemReferralCode(
          "Referred User",
          user.mongoUserId,
          user.referralCode
        );
      }
      setInReview(true);
      setSuccessMessage("Files uploaded successfully to the server!");
    } catch (apiError) {
      setError("Failed to send images to API.");
      console.error("Upload error:", apiError);
    }

    setUploading(false);
    setFrontImage(null);
    setBackImage(null);
    setSelfieImage(null);
  };

  return (
    <div className="identity-verification-container">
      {inReview ? (
        <div>
          <p>
            Your identity verification is currently under review. You will
            receive an email when you are verified. Refresh the page if you have
            received your email stating your account has been verified.
          </p>
        </div>
      ) : (
        <div className="identity-verification-card">
          <h3 className="identity-verification-title">
            Upload Identity Verification Documents
          </h3>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

          <div>
            <label>Document Type:</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="identity-verification-input"
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
                <div className="file-upload-container">
                  <button
                    onClick={() => {
                      setCameraActive(true);
                      setCaptureTarget("front");
                    }}
                    className="identity-verification-button"
                  >
                    Take a Picture
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setFrontImage)}
                    style={{ display: "none" }}
                    id="frontImageInput"
                  />
                  <label
                    htmlFor="frontImageInput"
                    className="identity-verification-button"
                  >
                    Choose File
                  </label>
                </div>
                {frontImage && <p>Front completed!</p>}
              </div>

              {documentsWithBack.has(documentType) && (
                <div className="document-section">
                  <label>Back of Document:</label>
                  <div className="file-upload-container">
                    <button
                      onClick={() => {
                        setCameraActive(true);
                        setCaptureTarget("back");
                      }}
                      className="identity-verification-button"
                    >
                      Take a Picture
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setBackImage)}
                      style={{ display: "none" }}
                      id="backImageInput"
                    />
                    <label
                      htmlFor="backImageInput"
                      className="identity-verification-button"
                    >
                      Choose File
                    </label>
                  </div>
                  {backImage && <p>Back completed!</p>}
                </div>
              )}

              <div className="document-section">
                <label>Selfie:</label>
                <div className="file-upload-container">
                  <button
                    onClick={() => {
                      setCameraActive(true);
                      setCaptureTarget("selfie");
                    }}
                    className="identity-verification-button"
                  >
                    Take a Picture
                  </button>
                </div>
                {selfieImage && <p>Selfie completed!</p>}
              </div>

              {cameraActive && (
                <div>
                  <video
                    ref={videoRef}
                    autoPlay
                    style={{
                      width: "100%",
                      maxHeight: "300px",
                      marginTop: "10px",
                    }}
                  ></video>
                  <div>
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
                  <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                </div>
              )}
            </>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="identity-verification-button"
          >
            {uploading ? "Uploading..." : "Submit Verification"}
          </button>
        </div>
      )}
    </div>
  );
};

export default IdentityVerification;
