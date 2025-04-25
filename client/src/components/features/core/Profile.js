import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  updateUser,
  softDeleteUserStatusUpdate,
  generateReferralCode,
} from "../../../services/userService";
import {
  deleteUser,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { useUser } from "../../../contexts/UserContext";
import TransactionHistory from "./TransactionHistory";
import { auth } from "../../../config/firebaseConfig";
import "../../../styles/components/core/Profile.css";
import Tooltip from "../../common/ToolTip";

const Profile = () => {
  const { user, setUser } = useUser();
  const [name, setName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  const [editing, setEditing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const navigate = useNavigate();

  const updateUserMeta = async () => {
    try {
      let updatedUserFields = {};
      if (auth.currentUser.displayName !== name) {
        await updateProfile(auth.currentUser, { displayName: name });
        updatedUserFields.name = name;
      } else {
        return;
      }
      if (Object.keys(updatedUserFields).length > 0) {
        await updateUser(user.mongoUserId, updatedUserFields);
        setUser((prev) => ({
          ...prev,
          ...updatedUserFields,
        }));
      }
      alert("User data updated successfully.");
    } catch (err) {
      console.error("Error updating user meta:", err.message);
      alert("Failed to update user meta. Please try again.");
    }
  };

  const updateUserEmail = async () => {
    try {
      if (auth.currentUser.email !== email) {
        await verifyBeforeUpdateEmail(auth.currentUser, email);
        await updateUser(user.mongoUserId, {
          email,
          emailVerificationStatus: "pending",
        });
        setUser((prev) => ({
          ...prev,
          email,
          emailVerificationStatus: "pending",
        }));
        await signOut(auth); // Firebase sign-out
        alert(
          "Please confirm the new email by clicking the link in the email we've sent. Then log back in."
        );
        navigate("/login");
      } else {
        return;
      }
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        alert(
          "Email updates require a recent login. Please log in again and retry."
        );
        navigate("/login");
      }
      console.error("Error updating user email:", err.message);
      alert("Failed to update user email. Please try again.");
    }
  };

  const handleUpdateUser = async () => {
    await updateUserMeta();
    await updateUserEmail();
    setEditing(false);
  };

  const handleDeleteUser = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account?\n\nThis action cannot be undone and any purchased credits will be lost."
      )
    ) {
      return;
    }
    try {
      await softDeleteUserStatusUpdate(user.mongoUserId);
      await deleteUser(auth.currentUser);
      setUser(null);
      alert("Your account has been successfully deleted.");
      navigate("/signup");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        await updateUser(user.mongoUserId, { accountStatus: "active" });
        alert(
          "Account deletion requires recent login. Please log in again and try again."
        );
        navigate("/login");
      } else {
        await updateUser(user.mongoUserId, { accountStatus: "active" });
        console.error("Error deleting user account:", err.message);
        alert(
          "An error occurred while deleting your account. Please try again."
        );
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase sign-out
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      if (
        user.emailVerificationStatus === "verified" &&
        user.smsVerificationStatus === "verified" &&
        user.idvStatus === "verified"
      ) {
        await sendPasswordResetEmail(auth, user.email);
        await signOut(auth); // Firebase sign-out
        navigate("/login");
        alert("Password reset email sent successfully.");
      } else {
        alert("Please verify your email, phone number, and identity before resetting your password.");
      }
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
      alert("Failed to send password reset email. Please try again.");
    }
  };

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(
        await generateReferralCode(user.mongoUserId)
      );
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000); // Reset the success message after 2 seconds
    } catch (error) {
      setCopySuccess("Failed to copy!");
      console.error("Failed to copy text:", error);
    }
  };

  const handleEditProfileClick = async () => {
    try {
      if (
        user.emailVerificationStatus === "verified" &&
        user.smsVerificationStatus === "verified" &&
        user.idvStatus === "verified"
      ) {
        setEditing(true);
      } else {
        alert("Please verify your email, phone number, and identity before editing your profile.");
      }
    } catch (error) {
      console.error("Failed to edit profile:", error);
      alert("Failed to edit profile. Please try again.");
    }
  };

  return (
    <div className="profile-container">
      {user ? (
        <div className="profile-grid">
          <div className="profile-section">
            <div className="referral-section">
              <div className="referral-text">
                Refer a friend and receive 50 Credits!{" "}
                {
                  <Tooltip
                    infoText={
                      "Note that the credits will not be received for the referrer until you have completed both email and identity verification."
                    }
                  />
                }
              </div>
              <button
                className="profile-button copy-button"
                onClick={handleCopyReferralLink}
              >
                {copySuccess || "Copy Referral Link"}
              </button>
            </div>
            <div className="credits-info">
              <div className="info-row">
                <span className="info-label">Spendable Credits:</span>
                <span className="info-value">{parseInt(user.credits)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">
                  Earned Credits This Tournament:
                </span>
                <span className="info-value">
                  {parseFloat(user.earnedCredits).toFixed(4)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Lifetime Earned Credits:</span>
                <span className="info-value">
                  {parseFloat(user.lifetimeEarnedCredits).toFixed(4)}
                </span>
              </div>
            </div>
            <div className="profile-info">
              {!editing ? (
                <>
                  <div className="user-info-container">
                    <button
                      className="edit-icon-button"
                      onClick={handleEditProfileClick}
                      aria-label="Edit profile"
                    />
                    <div className="info-row">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{user.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="edit-form">
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                  />
                  <div className="button-group">
                    <button
                      className="profile-button edit-button"
                      onClick={handleUpdateUser}
                    >
                      Update
                    </button>
                    <button
                      className="profile-button logout-button"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="button-group">
                <button
                  className="profile-button edit-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
                {user.authProvider !== "google" && (
                  <button
                    className="profile-button edit-button"
                    onClick={handleResetPassword}
                  >
                    Reset Password
                  </button>
                )}
                <button
                  className="profile-button edit-button"
                  onClick={() => navigate("/instructions")}
                >
                  How to Play
                </button>
                <button
                  className="profile-button delete-button"
                  onClick={handleDeleteUser}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <TransactionHistory />
          </div>
        </div>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
};

export default Profile;
