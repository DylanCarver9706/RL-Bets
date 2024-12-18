import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getMongoUserDataByFirebaseId } from "./services/userService";
import { useUser } from "./context/UserContext";
import { Routes, Route, useNavigate } from "react-router-dom";
import Wagers from "./components/Wagers";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import CreateWager from "./components/CreateWager";
import Schedule from "./components/Schedule";
import CreditShop from "./components/CreditShop";
import Leaderboard from "./components/Leaderboard";
import Log from "./components/Log";
import Admin from "./components/Admin";
import EmailVerification from "./components/EmailVerification";
import IdentityVerification from "./components/IdentityVerification";
import Settings from "./components/Settings";
import Credits from "./components/Credits";
import BugForm from "./components/BugForm";
import FeatureForm from "./components/FeatureForm";
import FeedbackForm from "./components/FeedbackForm";
import Hero from "./components/Hero";

function App() {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = async (firebaseUser) => {
      if (firebaseUser?.uid) {
        try {
          const idToken = await firebaseUser.getIdToken();
          console.log("Firebase ID token:", idToken);
          if (!idToken) {
            console.warn("ID token not available");
            setLoading(false);
            return;
          }

          // Fetch MongoDB user data
          const mongoUser = await getMongoUserDataByFirebaseId(
            firebaseUser.uid
          );
          console.log("Mongo User:", mongoUser);
          console.log("firebaseUser", firebaseUser);

          // Destructure the user object to remove the _id field
          const { _id, ...userWithoutId } = mongoUser;

          // Set the user state with the updated user object
          setUser({
            firebaseUserId: firebaseUser.uid,
            mongoUserId: _id,
            ...userWithoutId,
          });
        } catch {}
      } else {
        setUser(null); // User is logged out
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      handleAuthChange(firebaseUser);
    });

    return () => unsubscribe();
  }, [setUser, auth]);

  useEffect(() => {
    const routeUnverifiedUser = async () => {
      // If still loading, do nothing
      if (loading) {
        return;
      }

      // Check current path
      const currentPath = window.location.pathname;

      // Redirect unauthenticated users from protected routes
      if (!auth.currentUser || !user?.mongoUserId) {
        if (currentPath !== "/Auth") {
          navigate("/Auth");
        }
      }

      // console.log("Current Path:", currentPath);

      // Redirect authenticated users to Home
      if (auth.currentUser || user?.mongoUserId) {
        if (currentPath === "/Auth") {
          navigate("/Wagers");
        }
      }

      // If user has not verified email or IDV, redirect to respective pages
      if (auth.currentUser && user?.emailVerificationStatus !== "verified") {
        navigate("/Email-Verification");
      } else if (auth.currentUser && user?.idvStatus !== "verified") {
        navigate("/Identity-Verification");
      }
    };
    routeUnverifiedUser();
  }, [loading, user, navigate, auth?.currentUser]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {user &&
        user?.emailVerificationStatus === "verified" &&
        user?.idvStatus === "verified" && <Navbar />}
      <div>
        {user ? (
          <p>
            Welcome, Firebase UID: {user?.firebaseUserId} - MongoId:{" "}
            {user?.mongoUserId} - Email Verification Status:{" "}
            {user?.emailVerificationStatus} - IDV Status: {user?.idvStatus}
          </p>
        ) : (
          <p>Please log in</p>
        )}
      </div>
      <Routes>
        {/* This expression is needed because React Router does not check App before navigating to base route */}
        <Route path="/" element={<Hero />} />
        <Route path="/Auth" element={<Auth />} />
        <Route path="/Email-Verification" element={<EmailVerification />} />
        <Route path="/Identity-Verification" element={<IdentityVerification />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Create_Wager" element={<CreateWager />} />
        <Route path="/Schedule" element={<Schedule />} />
        <Route path="/Credit-Shop" element={<CreditShop />} />
        <Route path="/Leaderboard" element={<Leaderboard />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/Credits" element={<Credits />} />
        <Route path="/Bug-Form" element={<BugForm />} />
        <Route path="/Feature-Form" element={<FeatureForm />} />
        <Route path="/Feedback-Form" element={<FeedbackForm />} />
        <Route path="/Log" element={user?.userType === "admin" && <Log />} />
        <Route path="/Admin" element={user?.userType === "admin" && <Admin />} />
      </Routes>
    </>
  );
}

export default App;
