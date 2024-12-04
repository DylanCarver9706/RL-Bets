import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import { createUserInDatabase, updateUser, getMongoUserDataByFirebaseId } from "../services/userService.js";
import { generateLinkTokenForIDV, openPlaidIDV } from "../services/plaidService.js";
import { useUser } from "../context/UserContext.js";

const Auth = () => {
  const { setUser } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Test User");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [idvActive, setIdvActive] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let firebaseCredential;

      if (isLogin) {
        firebaseCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = firebaseCredential.user;

        // Fetch MongoDB user data
        const mongoUser = await getMongoUserDataByFirebaseId(firebaseUser.uid);

        setUser({
          firebaseUserId: firebaseUser.uid,
          mongoUserId: mongoUser.id,
          userType: mongoUser.type,
          idvStatus: mongoUser.idvStatus,
          credits: mongoUser.credits,
        });

        navigate("/");
      } else {
        firebaseCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = firebaseCredential.user;

        if (!firebaseUser?.uid) {
          throw new Error("Failed to retrieve Firebase user ID.");
        }

        // Create the user in MongoDB
        const mongoUserId = await createUserInDatabase(name, email, firebaseUser.uid);

        // Temporarily set the user state until the MongoDB fetch happens in `onAuthStateChanged`
        setUser((prevUser) => ({
          ...prevUser,
          firebaseUserId: firebaseUser.uid,
          mongoUserId,
          idvStatus: "unverified",
        }));

        // Generate Plaid Link token for IDV
        const linkTokenData = await generateLinkTokenForIDV(mongoUserId);

        if (!linkTokenData || !linkTokenData.link_token) {
          throw new Error("Failed to generate Plaid Link token.");
        }

        setIdvActive(true);

        try {
          const idvResult = await openPlaidIDV(linkTokenData.link_token);

          if (idvResult?.status === "success") {
            await updateUser(mongoUserId, { idvStatus: "verified" });
            setUser((prevUser) => ({
              ...prevUser,
              idvStatus: "verified",
            }));
            navigate("/");
          } else {
            navigate("/User");
          }
        } catch (error) {
          alert(error.message);
          navigate("/Auth");
        }
      }
    } catch (error) {
      console.error("Error during authentication:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email to reset the password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Please check your inbox.");
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
      alert("Failed to send password reset email. Please try again.");
    }
  };

  return (
    <div>
      {!idvActive && !showForgotPassword && (
        <div>
          <h2>{isLogin ? "Login" : "Sign Up"}</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label>Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </button>
          </form>
          {isLogin && (
            <button
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
              style={{ marginTop: "10px" }}
            >
              Forgot Password
            </button>
          )}
          <button onClick={() => setIsLogin(!isLogin)} disabled={loading}>
            {isLogin ? "Switch to Sign Up" : "Switch to Login"}
          </button>

          
        </div>
      )}
      {showForgotPassword && (
            <div style={{ marginTop: "20px" }}>
              <h3>Reset Password</h3>
              <p>
                Enter your email address and click "Send Reset Email" to reset your password.
              </p>
              <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
              <button onClick={handleForgotPassword} disabled={loading}>
                Send Reset Email
              </button>
              <button onClick={() => setShowForgotPassword(false)} style={{ marginLeft: "10px" }}>
                Cancel
              </button>
            </div>
          )}
    </div>
  );
};

export default Auth;
