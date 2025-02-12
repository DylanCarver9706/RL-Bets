import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../contexts/UserContext"; // Get user context
import { sendImagesToAPI } from "../services/firebaseService"; // API request function
import { updateUser } from "../services/userService";

const statesList = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", 
  "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", 
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", 
  "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", 
  "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

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

  // Address
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [selectedDate, setSelectedDate] = useState("");

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
    if (
      address1 === "" ||
      city === "" ||
      state === "" ||
      zip === ""
    ) {
      setError("Please fill in all required address fields.");
      return;
    }

    if (selectedDate === "") {
      setError("Please select your date of birth.");
      return;
    }

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

      // Update the user's address
      await updateUser(user.mongoUserId, {
        address1: address1,
        address2: address2,
        city: city,
        state: state,
        zip: zip,
        DOB: selectedDate,
      })

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
    <div>
      {inReview ? (
        <div>
          <p>
            Your identity verification is currently under review. You will
            receive an email when you are verified. Refresh the page if you have
            received your email stating your account has been verified.
          </p>
        </div>
      ) : (
        <div>
          <div>
            <h3>Address</h3>
            <input
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="Address Line 1"
              required
            />
            <input
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Address Line 2"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              required
            />
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Select a State</option>
              {statesList.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="Zip"
              required
            />
          </div>
          <div>
          <h3>Date of Birth</h3>
            <input
              type="date"
              onChange={(e) => {setSelectedDate(e.target.value)}}
              style={styles.dateInput}
            />
          </div>
          <h3>Upload Identity Verification Documents</h3>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

          <div>
            <label>Document Type:</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
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
              <div>
                <label>Front of Document:</label>
                <button
                  onClick={() => {
                    setCameraActive(true);
                    setCaptureTarget("front");
                  }}
                >
                  Take a Picture
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setFrontImage)}
                />
                {frontImage && <p>Front captured successfully!</p>}
              </div>

              {documentsWithBack.has(documentType) && (
                <div>
                  <label>Back of Document:</label>
                  <button
                    onClick={() => {
                      setCameraActive(true);
                      setCaptureTarget("back");
                    }}
                  >
                    Take a Picture
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setBackImage)}
                  />
                  {backImage && <p>Back captured successfully!</p>}
                </div>
              )}

              <div>
                <label>Take a Selfie (Required):</label>
                <button
                  onClick={() => {
                    setCameraActive(true);
                    setCaptureTarget("selfie");
                  }}
                >
                  Open Camera
                </button>
                {selfieImage && <p>Selfie captured successfully!</p>}
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
                    <button onClick={captureImage}>Capture</button>
                    <button onClick={stopCamera}>Cancel</button>
                  </div>
                  <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                </div>
              )}
            </>
          )}
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Submit Verification"}
          </button>
        </div>
      )}
    </div>
  );
};

export default IdentityVerification;

const styles = {
  dateInput: {
    padding: "8px",
    fontSize: "16px",
    marginTop: "5px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    cursor: "pointer",
  },
};