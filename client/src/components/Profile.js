import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUser, softDeleteUser } from "../services/userService.js";
import { createJiraIssue } from "../services/jiraService.js";
import {
  deleteUser,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth"; // Import sendPasswordResetEmail
import { auth } from "../firebaseConfig.js";
import { useUser } from "../context/UserContext.js";

const Profile = () => {
  const { user, setUser } = useUser();
  const [name, setName] = useState(user?.name);
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const navigate = useNavigate();

  // Handle updating the user information to Firebase and MongoDB
  const handleUpdate = async () => {
    try {
      // Update Firebase user profile
      if (auth.currentUser.displayName !== name) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      // Update MongoDB user
      await updateUser(user.mongoUserId, { name: name });

      setEditing(false);

      // Update global user state
      setUser((prevUser) => ({
        ...prevUser,
        name: name,
      }));

      alert("User info updated successfully");
    } catch (err) {
      console.error("Error updating user data:", err.message);
      alert("Failed to update user. Please try again.");
    }
  };

  // Handle deleting the user from Firebase and MongoDB
  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account?\n\nThis action cannot be undone and any purchased credits will be lost."
      )
    ) {
      return; // Exit if user cancels
    }
  
    try {
  
      const attemptDelete = async () => {
        try {
          await deleteUser(auth.currentUser);
          alert("Your account has been successfully deleted.");
          navigate("/Auth"); // Redirect to Auth after account deletion
          return true;
        } catch (deleteError) {
          // Handle reauthentication required error
          if (deleteError.code === "auth/requires-recent-login") {
            alert("Reauthentication required for account deletion.");
  
            // Determine the authentication provider, prioritize Google
            const providerId =
              auth.currentUser.providerData.find(
                (provider) => provider.providerId === "google.com"
              )?.providerId || auth.currentUser.providerData[0]?.providerId;
  
            try {
              if (providerId === "google.com") {
                // Google authentication
                const provider = new GoogleAuthProvider();
                await reauthenticateWithPopup(auth.currentUser, provider);
              } else if (providerId === "password") {
                // Email/password authentication
                const email = auth.currentUser.email;
                setShowPasswordInput(true);
                if (!password) {
                  alert("Password is required for reauthentication.");
                }
  
                const credential = EmailAuthProvider.credential(email, password);
                await reauthenticateWithCredential(auth.currentUser, credential);
              } else {
                throw new Error(
                  `Unsupported authentication provider: ${providerId}. Please contact support.`
                );
              }
  
              // Retry delete after successful reauthentication
              await deleteUser(auth.currentUser);
              alert("Your account has been successfully deleted.");
              return true;
            } catch (reauthError) {
              console.error("Reauthentication error:", reauthError);
  
              if (reauthError.code === "auth/popup-closed-by-user") {
                alert("Reauthentication canceled. Please try again.");
                return false;
              } else if (deleteError.code === "auth/cancelled-popup-request") {
                alert("Reauthentication canceled. Please try again.");
                return false;
              } else if (reauthError.code === "auth/user-mismatch") {
                alert(
                  "Reauthentication failed due to account mismatch. Please try again."
                );
                return false;
              } else {
                alert(
                  "Reauthentication failed. Please check your credentials and try again."
                );
                return false;
              }
            }
          }
        }
      };

      // Attempt to delete user
      const deleteSuccessful = await attemptDelete();

      // Mark the user as deleted in your MongoDB database
      if (deleteSuccessful === true) {
        await softDeleteUser(user.mongoUserId);
      }
  
      setUser(null); // Clear user state
      
      navigate("/Auth"); // Redirect to Auth after account deletion
    } catch (err) {
      console.error("Error deleting user account:", err.message);
      alert("An error occurred while deleting your account. Please try again.");
    }
  };
  
  const handlePasswordEntry = async () => {
    if (!password) {
      alert("Password cannot be empty.");
      return;
    }
  
    // Attempt reauthentication with entered password
    const email = auth.currentUser.email;
    const credential = EmailAuthProvider.credential(email, password);
  
    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
      await deleteUser(auth.currentUser);
  
      // Mark the user as deleted in MongoDB
      await softDeleteUser(user.mongoUserId);
  
      alert("Your account has been successfully deleted.");
      setUser(null); // Clear user state
      navigate("/Auth"); // Redirect to Auth after account deletion
    } catch (reauthError) {
      console.error("Reauthentication error:", reauthError);
      alert(
        "Reauthentication failed. Please check your credentials and try again."
      );
    } finally {
      // Reset password input state
      setPassword("");
      setShowPasswordInput(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase sign-out
      navigate("/Auth"); // Redirect to Auth after logout
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!user.email) {
      alert("Email is required to reset the password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Password reset email sent successfully.");
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
      alert("Failed to send password reset email. Please try again.");
    }
  };

  const handleEmailUpdate = async () => {
    try {
      const response = await createJiraIssue(
        user.name,
        user.email,
        user.mongoUserId,
        "Story",
        "Request for email update",
        "",
        "Requests For Email Change"
      );
      if (response.status === 200) {
        alert("Email update request sent successfully.");
      }
    } catch (error) {
      console.error("Error updating email:", error.message);
      alert("Failed to send email update request. Please try again.");
    }
  };
  
  const handleCancel = () => {
    setPassword(""); // Clear the password
    setShowPasswordInput(false); // Hide the input field
  };

  return (
    <>
      <div>
        <h2>User Profile</h2>
        {user ? (
          showPasswordInput ? (
            <div>
              <p>Enter Password To Continue Account Deletion</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Update password state
                style={{ marginBottom: "10px" }}
              />
              <br />
              <button onClick={handlePasswordEntry} style={{ marginRight: "10px" }}>
                Submit
              </button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          ) : (
            <div>
              <h3>Mongo ID: {user.mongoUserId}</h3>
              <h3>Firebase ID: {user.firebaseUserId}</h3>
              <div>
                {!editing ? (
                  <>
                    <p>Name: {user.name}</p>
                    <p>Email: {user.email}</p>
                    <button onClick={() => setEditing(true)}>Edit Profile</button>
                  </>
                ) : (
                  <>
                    <div>
                      <label>Name:</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <p>
                        The ability to update the email for an account is not
                        available at this time. Please create a new account or
                        submit a request to update the email here:{" "}
                      </p>
                      <button onClick={handleEmailUpdate}>
                        Send Email Update Request
                      </button>
                    </div>
                    <button onClick={handleUpdate}>Update User</button>
                    <button onClick={() => setEditing(false)}>Cancel</button>
                  </>
                )}
                <p>Credits: {user.credits}</p>
                <p>Earned Credits: {user.earnedCredits}</p>
                <p>Identity Verification Status: {user.idvStatus}</p>
                <p>Email Verification Status: {user.emailVerificationStatus}</p>
                <br />
                <button onClick={handleDelete} style={{ marginRight: "10px" }}>
                  Delete User
                </button>
                <button onClick={handleLogout} style={{ marginRight: "10px" }}>
                  Logout
                </button>
                <button onClick={handleResetPassword} style={{ marginRight: "10px" }}>
                  Reset Password
                </button>
              </div>
            </div>
          )
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
    </>
  );
};

export default Profile;
