import React, { useState, useEffect } from "react";
import { deleteUserIdvFiles, fetchIdentityVerificationImages } from "../services/firebaseService";
import { getUsers, validateUserIdv } from "../services/adminService";

const AdminIdentityVerification = () => {
  const [userImages, setUserImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dob, setDob] = useState({});
  const [denyReason, setDenyReason] = useState({});
  const [denyingUserId, setDenyingUserId] = useState({});

  useEffect(() => {
    const getImages = async () => {
      try {
        const fetchedImages = await fetchIdentityVerificationImages();
        const fetchedUsers = await getUsers();

        if (fetchedImages.length === 0) {
          setLoading(false);
          return;
        }

        // Create a user lookup map { userId: userName }
        const userMap = fetchedUsers.reduce((acc, user) => {
          acc[user._id] = user.name;
          return acc;
        }, {});

        // Group and sort images by user
        const groupedImages = fetchedImages.reduce((acc, image) => {
          const pathParts = image.name.split("/");
          const userId = pathParts[1]?.trim(); // Ensure no leading/trailing spaces
          const documentType = pathParts[2]; // Example: "Passport"
          const imageType = pathParts[3]; // Example: "front_Document.jpg"

          // **Skip images with missing or invalid userId**
          // Skips root directory being returned as a file
          if (!userId || !userMap[userId]) {
            return acc;
          }

          if (!acc[userId]) {
            acc[userId] = {
              userName: userMap[userId],
              userId,
              documents: [],
              currentIndex: 0,
            };
          }

          acc[userId].documents.push({
            documentType,
            imageType,
            url: image.url,
          });

          return acc;
        }, {});

        // Sort images in the order of Front → Back → Selfie
        Object.values(groupedImages).forEach((user) => {
          user.documents.sort((a, b) => {
            const order = { front: 1, back: 2, selfie: 3 };
            return (
              (order[a.imageType.split("_")[0]] || 4) - 
              (order[b.imageType.split("_")[0]] || 4)
            );
          });
        });

        setUserImages(groupedImages);
      } catch (err) {
        setError("Failed to load identity verification images.");
        console.error(err);
      }
      setLoading(false);
    };

    getImages();
  }, []);

  // Handle DOB Input with Auto-Formatting (MM/DD/YYYY)
  const handleDobChange = (userId, value) => {
    let formattedValue = value
      .replace(/\D/g, "") // Remove non-numeric characters
      .slice(0, 8); // Limit to 8 digits

    if (formattedValue.length >= 2) {
      formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2)}`;
    }
    if (formattedValue.length >= 5) {
      formattedValue = `${formattedValue.slice(0, 5)}/${formattedValue.slice(5)}`;
    }

    setDob((prev) => ({ ...prev, [userId]: formattedValue }));
  };

  // **Combined Function for Approve/Deny**
  const handleSubmit = async (userId, status) => {
    if (!dob[userId]) {
      alert("Please enter a valid date of birth.");
      setError("Please enter a valid date of birth.");
      return;
    }

    if (status === "denied" && !denyReason[userId]) {
      alert("Please select a deny reason.");
      setError("Please select a deny reason.");
      return;
    }

    const submissionData = {
      userId,
      status,
      dob: dob[userId],
      reason: status === "denied" ? denyReason[userId] : null,
    };

    await validateUserIdv(submissionData);
    await deleteUserIdvFiles(userId);

    // **Remove user from the UI without recalling getImages()**
    setUserImages((prev) => {
      const updatedUsers = { ...prev };
      delete updatedUsers[userId];
      return updatedUsers;
    });

    handleDenyReasonCancel();
  };

  const handleDenyReasonCancel = () => {
    setDenyingUserId({});
    setDenyReason({});
  };

  const handleNext = (userId, user) => {
    setUserImages((prev) => ({
      ...prev,
      [userId]: {
        ...user,
        currentIndex: (user.currentIndex + 1) % user.documents.length,
      },
    }));
  };

  const handlePrev = (userId, user) => {
    setUserImages((prev) => ({
      ...prev,
      [userId]: {
        ...user,
        currentIndex:
          (user.currentIndex - 1 + user.documents.length) % user.documents.length,
      },
    }));
  };

  return (
    <div style={styles.container}>
      <h2>Identity Verification Documents</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}
      {!loading && Object.keys(userImages).length === 0 && (
        <p>No documents to validate.</p>
      )}

      <div style={styles.grid}>
        {Object.entries(userImages).map(([userId, user]) => (
          <div key={user.userId} style={styles.card}>
            <p><strong>User Name:</strong> {user.userName}</p>
            <p><strong>User Mongo ID:</strong> {user.userId}</p>

            {/* Image Slideshow */}
            <div style={styles.imageContainer}>
              <img
                src={user.documents[user.currentIndex]?.url}
                alt="ID Document"
                style={styles.image}
              />
            </div>
            <div style={styles.controls}>
              <button onClick={() => handlePrev(userId, user)} style={styles.button}>◀</button>
              <span>{user.currentIndex + 1} / {user.documents.length}</span>
              <button onClick={() => handleNext(userId, user)} style={styles.button}>▶</button>
            </div>

            {/* DOB Input */}
            <label><strong>Date of Birth:</strong></label>
            <input
              type="text"
              placeholder="MM/DD/YYYY"
              value={dob[user.userId] || ""}
              onChange={(e) => handleDobChange(user.userId, e.target.value)}
              maxLength={10}
              style={styles.dobInput}
            />

            {/* Approve / Deny Options */}
            {!denyingUserId[user.userId] ? (
              <div>
                <button style={styles.approveButton} onClick={() => handleSubmit(user.userId, "verified")}>Approve</button>
                <button style={styles.denyButton} onClick={() => setDenyingUserId((prev) => ({ ...prev, [user.userId]: true }))}>Deny</button>
              </div>
            ) : (
              <div>
                <select
                  onChange={(e) =>
                    setDenyReason((prev) => ({ ...prev, [user.userId]: e.target.value }))
                  }
                >
                  <option value="">Select Deny Reason</option>
                  <option value="Blurry Image">Blurry Image</option>
                  <option value="Mismatched Information">Mismatched Information</option>
                  <option value="Fake Document">Fake Document</option>
                  <option value="Underage">Underage</option>
                </select>
                <button onClick={() => handleSubmit(user.userId, "denied")}>Submit Denial</button>
                <button onClick={() => handleDenyReasonCancel()}>Cancel</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminIdentityVerification;

const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  card: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "15px",
    backgroundColor: "#635d5d",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
  },
  imageContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  image: {
    width: "100%",
    borderRadius: "8px",
    marginTop: "10px",
  },
  error: {
    color: "red",
  },
  approveButton: {
    backgroundColor: "green",
    color: "white",
    padding: "5px 10px",
    margin: "5px",
    cursor: "pointer",
    border: "none",
    borderRadius: "5px",
  },
  denyButton: {
    backgroundColor: "red",
    color: "white",
    padding: "5px 10px",
    margin: "5px",
    cursor: "pointer",
    border: "none",
    borderRadius: "5px",
  },
  dobInput: {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    marginTop: "5px",
    textAlign: "center",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
  },
  button: {
    backgroundColor: "#333",
    color: "white",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "5px",
  },
};