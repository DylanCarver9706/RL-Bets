import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";

const ForgotPassword = () => {
  const [email, setEmail] = useState("testuser@example.com");
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
    <div>
      <h2>New Forgot Password</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button disabled={loading} type="submit">
          {"Reset Password"}
        </button>
        <Link to="/Login">Back to Login</Link>
      </form>
    </div>
  );
};
export default ForgotPassword;
