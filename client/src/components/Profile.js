import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  updateUser,
  softDeleteUser,
  generateReferralCode,
} from "../services/userService.js";
import {
  deleteUser,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { useUser } from "../contexts/UserContext.js";
import TransactionHistory from "./TransactionHistory.js";
import { auth } from "../firebaseConfig.js";

const Profile = () => {
  const { user, setUser } = useUser();
  const [name, setName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  const [editing, setEditing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const navigate = useNavigate();

  console.log("User in Profile:", user);

  const updateUserMeta = async () => {
    try {
      let updatedUserFields = {};
      if (auth.currentUser.displayName !== name) {
        await updateProfile(auth.currentUser, {displayName: name});
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
        navigate("/Login");
      } else {
        return;
      }
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        alert(
          "Email updates require a recent login. Please log in again and retry."
        );
        navigate("/Login");
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
      await deleteUser(auth.currentUser);
      await softDeleteUser(user.mongoUserId);
      setUser(null);
      alert("Your account has been successfully deleted.");
      navigate("/Signup");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        alert(
          "Account deletion requires recent login. Please log in again and try again."
        );
        navigate("/Login");
      } else {
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
      navigate("/Login");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      await signOut(auth); // Firebase sign-out
      navigate("/Login");
      alert("Password reset email sent successfully.");
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

  return (
    <>
      <div>
        <h2>User Profile</h2>
        {user ? (
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
                    <label>Name: </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <br />
                    <label>Email: </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button onClick={handleUpdateUser}>Update User</button>
                  <button onClick={() => setEditing(false)}>Cancel</button>
                </>
              )}
              <p>Credits: {parseFloat(user.credits).toFixed(4)}</p>
              <p>Earned Credits: {parseFloat(user.earnedCredits).toFixed(4)}</p>
              <p>
                Lifetime Earned Credits:{" "}
                {parseFloat(user.lifetimeEarnedCredits).toFixed(4)}
              </p>
              <p>Identity Verification Status: {user.idvStatus}</p>
              <p>Email Verification Status: {user.emailVerificationStatus}</p>
              <br />
              <button
                onClick={handleDeleteUser}
                style={{ marginRight: "10px" }}
              >
                Delete User
              </button>
              <br />
              <button onClick={handleLogout} style={{ marginRight: "10px" }}>
                Logout
              </button>
              {user.authProvider !== "google" && (
                <div>
                <button
                  onClick={handleResetPassword}
                  style={{ marginRight: "10px" }}
                >
                  Reset Password
                </button>
              </div>
              )}
              {copySuccess ? (
              <div>
                 <br />
                <p style={{ marginRight: "10px" }}>{copySuccess}</p>
              </div>
              ) : (
                <button
                  onClick={handleCopyReferralLink}
                  style={{ marginRight: "10px" }}
                >
                  Copy Referral Link
                </button>
              )}
            </div>
          </div>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
      <div>{auth.currentUser && <TransactionHistory />}</div>
    </>
  );
};

export default Profile;
