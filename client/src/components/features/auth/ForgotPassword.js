import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../../config/firebaseConfig";
import "../../../styles/components/auth/ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      alert("Check your email for a password reset link.");
      navigate("/Login");
    } catch (error) {
      console.error("Error during authentication:", error.message);
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2 className="forgot-password-header">Reset Password</h2>

        {error && <p className="error-message">{error}</p>}

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="button-group">
            <button className="reset-button" disabled={loading} type="submit">
              {loading ? "Sending..." : "Reset Password"}
            </button>

            <Link to="/Login" className="back-link">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
