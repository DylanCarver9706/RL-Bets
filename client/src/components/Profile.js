import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUser, deleteUser } from "../services/userService.js";
import { createJiraIssue } from "../services/jiraService.js";
import {
  deleteUser as firebaseDeleteUser,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"; // Import sendPasswordResetEmail
import { auth } from "../firebaseConfig.js";
import { useUser } from "../context/UserContext.js";

const Profile = () => {
  const { user, setUser } = useUser();
  const [name, setName] = useState(user?.name);
  const [editing, setEditing] = useState(false); // Track if editing mode is active
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
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        // Delete user from MongoDB
        await deleteUser(user.mongoUserId);

        // Delete Firebase user if present
        if (auth.currentUser) {
          await firebaseDeleteUser(auth.currentUser);
        }

        alert("User deleted successfully.");
        navigate("/Auth"); // Redirect to Auth after account deletion
      } catch (err) {
        console.error("Error deleting user account:", err.message);
        alert("Error deleting user account. Please try again.");
      }
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
      const response = await createJiraIssue(user.name, user.email, user.mongoUserId, "Story", "Request for email update", "", "Requests For Email Change");
      if (response.status === 200) {
        alert("Email update request sent successfully.");
      }
    } catch (error) {
      console.error("Error updating email:", error.message);
      alert("Failed to send email update request. Please try again.");
    }
  };

  return (
    <div>
      <h2>User Profile</h2>
      {user ? (
        <div>
          <h3>Mongo ID: {user.mongoUserId}</h3>
          <h3>Firebase ID: {user.firebaseUserId}</h3>
          {user ? (
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
              <button onClick={handleUpdate}>Update User</button>
              <button onClick={handleDelete} style={{ marginLeft: "10px" }}>
                Delete User
              </button>
              <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
                Logout
              </button>
              <button
                onClick={handleResetPassword}
                style={{ marginLeft: "10px" }}
              >
                Reset Password
              </button>
            </div>
          ) : (
            <p>Loading user details...</p>
          )}
        </div>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
};

export default Profile;
