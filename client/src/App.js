import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getMongoUserDataByFirebaseId,
  userLocationLegal,
  checkGeolocationPermission,
} from "./services/userService";
import { useUser } from "./context/UserContext";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
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
import IllegalState from "./components/IllegalState";
import LocationPermissionRequired from "./components/LocationPermissionRequired";

const ProtectedRoute = ({ loggedIn, redirectTo = "/Auth", children }) => {
  return loggedIn ? children : <Navigate to={redirectTo} />;
};

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
            locationValid: await userLocationLegal(),
            locationPermissionGranted: await checkGeolocationPermission(),
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
  }, [setUser, auth, navigate]);

  useEffect(() => {
    const routeUser = async () => {
      // If still loading, do nothing
      if (loading) {
        return;
      }

      console.log("User:", user);

      // Check current path
      const currentPath = window.location.pathname;

      const unprotectedRoutes = ["/"];

      // Allow all users to access unprotected routes
      if (unprotectedRoutes.includes(currentPath)) {
        return;
      }

      // If user has not verified email or IDV, redirect to respective pages
      if (auth.currentUser && user?.emailVerificationStatus !== "verified") {
        navigate("/Email-Verification");
      } else if (auth.currentUser && user?.idvStatus !== "verified") {
        navigate("/Identity-Verification");
      } else if (auth.currentUser && !user?.locationPermissionGranted) {
        navigate("/Location-Permission-Required");
      } else if (auth.currentUser && !user?.locationValid) {
        navigate("/Illegal-State");
      }

    };
    routeUser();
  }, [loading, user, navigate, auth?.currentUser]);

  if (loading) {
    return <p>Loading...</p>;
  }

  const locationPermissionGranted = user?.locationPermissionGranted;
  const locationValid = user?.locationValid;
  const loggedIn = auth?.currentUser !== null && user?.mongoUserId !== null;
  const admin = loggedIn && user?.userType === "admin";

  return (
    <>
      {user &&
        user?.emailVerificationStatus === "verified" &&
        user?.idvStatus === "verified" && <Navbar />}
      <div>
        {user ? (
          <p>
            Welcome, Firebase UID: {user?.firebaseUserId} || 
            MongoId:{" "}{user?.mongoUserId} ||
            Email Verification Status:{" "}{user?.emailVerificationStatus} ||
            IDV Status: {user?.idvStatus}{" "} ||
            Location Permission Granted: {`${user?.locationPermissionGranted}`}{" "} ||
            Location Valid: {`${user?.locationValid}`}
          </p>
        ) : (
          <p>Please log in</p>
        )}
      </div>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Hero />} />

        {/* Protected Routes */}
        <Route
          path="/Auth"
          element={
            <ProtectedRoute loggedIn={!loggedIn} redirectTo="/Wagers">
              <Auth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Wagers"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <Wagers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Create_Wager"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <CreateWager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Profile"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Email-Verification"
          element={
            <ProtectedRoute loggedIn={loggedIn} redirectTo="/Wagers">
              <EmailVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Identity-Verification"
          element={
            <ProtectedRoute loggedIn={loggedIn} redirectTo="/Wagers">
              <IdentityVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Settings"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Credits"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <Credits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Schedule"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/CreditShop"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <CreditShop />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Leaderboard"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/BugForm"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <BugForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/FeatureForm"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <FeatureForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/FeedbackForm"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <FeedbackForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Illegal-State"
          element={
            <ProtectedRoute loggedIn={loggedIn && !locationValid} redirectTo="/Wagers">
              <IllegalState />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Location-Permission-Required"
          element={
            <ProtectedRoute loggedIn={loggedIn && !locationPermissionGranted} redirectTo="/Wagers">
              <LocationPermissionRequired />
            </ProtectedRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="/Log"
          element={
            <ProtectedRoute loggedIn={loggedIn && admin}>
              <Log />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Admin"
          element={
            <ProtectedRoute loggedIn={loggedIn && admin}>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
