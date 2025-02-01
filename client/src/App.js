import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { usePageTracking } from "./services/firebaseService";
import {
  getMongoUserDataByFirebaseId,
  userLocationLegal,
  checkGeolocationPermission,
  userAgeLegal,
} from "./services/userService";
import { getLatestPrivacyPolicy, getLatestTermsOfService } from "./services/agreementsService";
import { useUser } from "./context/UserContext";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { checkServerStatus } from "./services/appService";
import socket from "./services/socket";
import Wagers from "./components/Wagers";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CreateWager from "./components/CreateWager";
import TournamentHistory from "./components/TournamentHistory";
import CreditShop from "./components/CreditShop";
import LifetimeLeaderboard from "./components/LifetimeLeaderboard";
import CurrentTournamentLeaderboard from "./components/CurrentTournamentLeaderboard";
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
import IllegalAge from "./components/IllegalAge";
import SomethingWentWrong from "./components/SomethingWentWrong";
import AppOutage from "./components/AppOutage";
import CurrentTournament from "./components/CurrentTournament";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import Agreements from "./components/Agreements";
import PageNotFound from "./components/PageNotFound";
import SuspendedUser from "./components/SuspendedUser";
import AdminEmail from "./components/AdminEmail";


function App() {
  usePageTracking();
  const { user, setUser } = useUser();
  // eslint-disable-next-line
  const [unprotectedRoutes, setUnprotectedRoutes] = useState(process.env.REACT_APP_UNPROTECTED_ROUTES.split(","));
  const [loading, setLoading] = useState(true);
  const [serverLive, setServerLive] = useState(true); // Server status
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState(null);
  const [termsOfServiceVersion, setTermsOfServiceVersion] = useState(null);
  const navigate = useNavigate();

  // Check server status on app mount
  useEffect(() => {
    const getServerStatus = async () => {
      const isLive = await checkServerStatus();
      setServerLive(isLive);

      if (!isLive) {
        console.error("Server is down. Redirecting to App-Outage.");
        navigate("/App-Outage");
      }
    };

    getServerStatus();

    // Get latest privacy policy and terms of service versions
    const getLatestAgreements = async () => {
      const privacyPolicy = await getLatestPrivacyPolicy("privacy-policy");
      const termsOfService = await getLatestTermsOfService("terms-of-service");

      localStorage.setItem("termsOfServiceVersion", termsOfService.version);
      localStorage.setItem("privacyPolicyVersion", privacyPolicy.version);

      setPrivacyPolicyVersion(parseInt(privacyPolicy.version));
      setTermsOfServiceVersion(parseInt(termsOfService.version));
    }

    getLatestAgreements();

  }, [navigate]);

  useEffect(() => {
    const handleAuthChange = async (firebaseUser) => {

      if (firebaseUser?.uid) {
        try {
          const idToken = await firebaseUser.getIdToken();
          console.log("Firebase ID token:", idToken);
          if (!idToken) {
            console.warn("ID token not available");
            return;
          }

          // Fetch MongoDB user data
          const mongoUser = await getMongoUserDataByFirebaseId(
            firebaseUser.uid
          );
          console.log("Mongo User:", mongoUser);
          console.log("firebaseUser", firebaseUser);

          const userLocationMeta = await userLocationLegal();
          const ageValid = await userAgeLegal(userLocationMeta?.state, mongoUser?.DOB);

          // Destructure the user object to remove the _id field
          const { _id, ...userWithoutId } = mongoUser;

          // Set the user state with the updated user object
          setUser({
            firebaseUserId: firebaseUser.uid,
            mongoUserId: _id,
            ...userWithoutId,
            ageValid: ageValid,
            locationValid: userLocationMeta?.allowed,
            currentState: userLocationMeta?.state,
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
  }, [setUser]);
      
  // Get a potential referral code from the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get("ref");
        
    if (referralCode) {
      // Save the referral code in localStorage or state
      localStorage.setItem("referralCode", referralCode);

      // Optionally navigate to a specific route or process the referral code
      navigate("/Auth");
    }
  }, [navigate]);

  useEffect(() => {
    const routeUser = async () => {
      // If still loading, do nothing
      if (loading || !serverLive) {
        return;
      }

      console.log("User:", user);

      // Check current path
      const currentPath = window.location.pathname;

      // Allow all users to access unprotected routes
      if (unprotectedRoutes.includes(currentPath)) {
        return;
      }

      // If user has not verified email or IDV, redirect to respective pages
      if (auth.currentUser && !user.locationPermissionGranted) {
        navigate("/Location-Permission-Required");
      } else if (auth.currentUser && user.emailVerificationStatus !== "verified") {
        navigate("/Email-Verification");
      } else if (auth.currentUser && user.idvStatus !== "verified") {
        navigate("/Identity-Verification");
      } else if (auth.currentUser && !user.locationValid) {
        navigate("/Illegal-State");
      } else if (auth.currentUser && !user?.ageValid) {
        navigate("/Illegal-Age");
      } else if (auth.currentUser && user?.accountStatus === "suspended") {
        navigate("/Account-Suspended");
      }

    };
    routeUser();
  }, [loading, user, navigate, serverLive, unprotectedRoutes]);

  // Initialize the socket connection when the app mounts
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  const locationPermissionGranted = user?.locationPermissionGranted;
  const locationValid = user?.locationValid;
  const ageValid = user?.ageValid;
  const loggedIn = auth?.currentUser !== null && user?.mongoUserId !== null;
  const accountSuspended = user?.accountStatus === "suspended";
  const admin = loggedIn && user?.userType === "admin";
  const requirePp = loggedIn && parseInt(user?.pp.split("Accepted v")[1].split(" at")[0]) !== privacyPolicyVersion;
  const requireTos = loggedIn && parseInt(user?.tos.split("Accepted v")[1].split(" at")[0]) !== termsOfServiceVersion;

  return (
    <div style={styles.container}>
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
            Location Valid: {`${user?.locationValid}`}{" "} ||
            Age Valid: {`${user?.ageValid}`}
          </p>
        ) : (
          <p>Please log in</p>
        )}
      </div>
      {/* Show the Agreements banner if the user has not accepted the latest version of the Privacy Policy or Terms of Service */}
      {(requireTos || requirePp) && !unprotectedRoutes.includes(window.location.pathname) && <Agreements requireTos={requireTos} requirePp={requirePp} tosVersion={termsOfServiceVersion} ppVersion={privacyPolicyVersion} />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Hero />} />
        <Route path="/Whoopsie-Daisy" element={<SomethingWentWrong />} />
        <Route path="/Bug-Form" element={<BugForm />} />
        <Route path="/Feature-Form" element={<FeatureForm />} />
        <Route path="/Feedback-Form" element={<FeedbackForm />} />
        <Route path="/Privacy-Policy" element={<PrivacyPolicy />} />
        <Route path="/Terms-Of-Service" element={<TermsOfService />} />
        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<PageNotFound />} />

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
          path="/Tournament-History"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <TournamentHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Credit-Shop"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <CreditShop />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Lifetime-Leaderboard"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <LifetimeLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Tournament-Leaderboard"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <CurrentTournamentLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Tournament"
          element={
            <ProtectedRoute loggedIn={loggedIn}>
              <CurrentTournament />
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
        <Route
          path="/Illegal-Age"
          element={
            <ProtectedRoute loggedIn={loggedIn && !ageValid} redirectTo="/Wagers">
              <IllegalAge />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Account-Suspended"
          element={
            <ProtectedRoute loggedIn={loggedIn && accountSuspended} redirectTo="/Wagers">
              <SuspendedUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/App-Outage"
          element={
            <ProtectedRoute loggedIn={!serverLive} redirectTo="/Wagers">
              <AppOutage />
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
        <Route
          path="/Admin-Email"
          element={
            <ProtectedRoute loggedIn={loggedIn && admin}>
              <AdminEmail />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
};

export default App;
