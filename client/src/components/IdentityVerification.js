import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext"; // Get user context
import { sendImageToAPI } from "../services/firebaseService"; // API request function
import { updateUser } from "../services/userService";

const documentTypes = [
  "Driver's License",
  "ID Card",
  "Passport",
  "Military ID",
  "Residency Permit Card",
  "Temporary Visa",
];

// Documents that require both front and back
const documentsWithBack = new Set(["Driver's License", "ID Card", "Residency Permit Card"]);

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

  // useEffect to set setInReview to true if user.idvStatus === "review"
  useEffect(() => {
    if (user && user.idvStatus === "review") {
      setInReview(true);
    }
  }, [user]);

  // Handle file selection
  const handleFileChange = (e, setImage) => {
    if (e.target.files.length > 0) {
      setImage(e.target.files[0]);
      setError(null);
      setSuccessMessage("");
    }
  };

  // Handle file upload (send only to server)
  const handleUpload = async () => {
    if (!documentType) {
      setError("Please select a document type.");
      return;
    }

    if (!frontImage) {
      setError("Please upload the front of the document.");
      return;
    }

    if (documentsWithBack.has(documentType) && !backImage) {
      setError("Please upload the back of the document.");
      return;
    }

    if (!selfieImage) {
      setError("Please upload a selfie.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("userId", user.mongoUserId);
      formData.append("userName", user.name);
      formData.append("frontImage", frontImage);
      if (documentsWithBack.has(documentType)) {
        formData.append("backImage", backImage);
      }
      formData.append("selfieImage", selfieImage);

      await sendImageToAPI(formData);
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
          <p>Your identity verification is currently under review. You will receive an email when you are verified.</p>
        </div>
      ) : (
      <div>
      <h3>Upload Identity Verification Documents</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

      <div>
        <label>Document Type:</label>
        <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
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
        <label>Upload Front of Document:</label>
        <input type="file" onChange={(e) => handleFileChange(e, setFrontImage)} accept="image/*" />
      </div>

      {documentsWithBack.has(documentType) && (
        <div>
          <label>Upload Back of Document:</label>
          <input type="file" onChange={(e) => handleFileChange(e, setBackImage)} accept="image/*" />
        </div>
      )}

      <div>
        <label>Upload Selfie:</label>
        <input type="file" onChange={(e) => handleFileChange(e, setSelfieImage)} accept="image/*" />
      </div>

      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Documents"}
      </button>
      </>
      )}
      </div>
  )}
    </div>
  );
};

export default IdentityVerification;
