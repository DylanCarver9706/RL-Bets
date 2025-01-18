import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUser, softDeleteUser, generateReferralCode } from "../services/userService.js";
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
import TransactionHistory from "./TransactionHistory.js";

const Profile = () => {
  const { user, setUser } = useUser();
  const [name, setName] = useState(user?.name);
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
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
          if (deleteError.code === "auth/requires-recent-login") {
            alert("Reauthentication required for account deletion.");
            // Handle reauthentication
            const providerId =
              auth.currentUser.providerData.find(
                (provider) => provider.providerId === "google.com"
              )?.providerId || auth.currentUser.providerData[0]?.providerId;
  
            if (providerId === "google.com") {
              try {
                const provider = new GoogleAuthProvider();
                await reauthenticateWithPopup(auth.currentUser, provider);
                return await attemptDelete(); // Retry deletion
              } catch (reauthError) {
                console.error("Reauthentication error (Google):", reauthError);
                if (reauthError.code === "auth/popup-closed-by-user") {
                  alert("Reauthentication canceled. Please try again.");
                } else {
                  alert("Reauthentication failed. Please try again.");
                }
                return false;
              }
            } else if (providerId === "password") {
              setShowPasswordInput(true);
              return false; // Wait for password submission
            } else {
              alert(
                `Unsupported authentication provider: ${providerId}. Please contact support.`
              );
              return false;
            }
          } else {
            throw deleteError;
          }
        }
      };
  
      // Attempt to delete user
      const deleteSuccessful = await attemptDelete();
  
      if (deleteSuccessful) {
        await softDeleteUser(user.mongoUserId); // Mark user as deleted in MongoDB
        setUser(null); // Clear user state
        navigate("/Auth"); // Redirect to Auth
      }
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
  
    const email = auth.currentUser.email;
    const credential = EmailAuthProvider.credential(email, password);
  
    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
      await deleteUser(auth.currentUser); // Retry deletion after reauthentication
      await softDeleteUser(user.mongoUserId); // Mark user as deleted in MongoDB
  
      alert("Your account has been successfully deleted.");
      setUser(null); // Clear user state
      navigate("/Auth"); // Redirect to Auth
    } catch (reauthError) {
      console.error("Reauthentication error (password):", reauthError);
      alert("Reauthentication failed. Please check your credentials and try again.");
    } finally {
      setPassword(""); // Reset password state
      setShowPasswordInput(false); // Hide password input
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

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(await generateReferralCode(user.mongoUserId));
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000); // Reset the success message after 2 seconds
    } catch (error) {
      setCopySuccess("Failed to copy!");
      console.error("Failed to copy text:", error);
    }
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
                <p>Credits: {parseFloat(user.credits).toFixed(4)}</p>
                <p>Earned Credits: {parseFloat(user.earnedCredits).toFixed(4)}</p>
                <p>Lifetime Earned Credits: {parseFloat(user.lifetimeEarnedCredits).toFixed(4)}</p>
                <p>Identity Verification Status: {user.idvStatus}</p>
                <p>Email Verification Status: {user.emailVerificationStatus}</p>
                <br />
                <button onClick={handleDelete} style={{ marginRight: "10px" }}>
                  Delete User
                </button>
                <br />
                <button onClick={handleLogout} style={{ marginRight: "10px" }}>
                  Logout
                </button>
                <br />
                {user.authProvider !== "google" && (
                  <button onClick={handleResetPassword} style={{ marginRight: "10px" }}>
                    Reset Password
                  </button>
                )}
                <br />
                {copySuccess ? (
                  <p style={{ marginRight: "10px" }}>{copySuccess}</p>
                ) : (
                <button onClick={handleCopyReferralLink} style={{ marginRight: "10px" }}>
                  Copy Referral Link
                </button>
                )}
              </div>
            </div>
          )
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
      <div>
        <TransactionHistory />
      </div>
    </>
  );
};

export default Profile;
