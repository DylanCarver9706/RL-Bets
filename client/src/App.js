import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { usePageTracking } from "./services/firebaseService";
import {
  getMongoUserDataByFirebaseId,
  userLocationLegal,
  checkGeolocationPermission,
} from "./services/userService";
import { getLatestPrivacyPolicy, getLatestTermsOfService } from "./services/agreementsService";
import { useUser } from "./contexts/UserContext";
import { Routes, Route, useNavigate } from "react-router-dom";
import socket from "./services/socket";
import Wagers from "./components/Wagers";
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
import PrivateRoute from "./components/PrivateRoute";
import Signup from "./components/Signup";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";

function App() {
  usePageTracking();
  const { user, setUser } = useUser();
  // eslint-disable-next-line
  const [unprotectedRoutes, setUnprotectedRoutes] = useState(process.env.REACT_APP_UNPROTECTED_ROUTES.split(","));
  const [loading, setLoading] = useState(true);
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState(null);
  const [termsOfServiceVersion, setTermsOfServiceVersion] = useState(null);
  const navigate = useNavigate();

  // Handle auth state changes from Firebase
  useEffect(() => {
    if (auth.currentUser && user && user.mongoUserId !== null) {
      return;
    }
    setLoading(true);
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

          // Destructure the user object to remove the _id field
          const { _id, ...userWithoutId } = mongoUser;

          // Set the user state with the updated user object
          setUser({
            firebaseUserId: firebaseUser.uid,
            mongoUserId: _id,
            ...userWithoutId,
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
    // eslint-disable-next-line
  }, [setUser, navigate]);

  // Initialize the socket connection when the app mounts
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);
      
  // Get a potential referral code from the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get("ref");
        
    if (referralCode) {
      // Save the referral code in localStorage or state
      localStorage.setItem("referralCode", referralCode);

      // Optionally navigate to a specific route or process the referral code
      navigate("/Signup");
    }
  }, [navigate]);

  // Reroute users to the appropriate page based on their permission states
  useEffect(() => {
    const routeUser = async () => {
      // If still loading, do nothing
      if (loading || auth?.currentUser === null || user?.mongoUserId === null) {
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
      if (auth.currentUser && user?.locationPermissionGranted && user?.locationPermissionGranted === false) {
        navigate("/Location-Permission-Required");
      } else if (auth.currentUser && user?.emailVerificationStatus && user?.emailVerificationStatus !== "verified") {
        navigate("/Email-Verification");
      } else if (auth.currentUser && user?.idvStatus && user?.idvStatus !== "verified") {
        navigate("/Identity-Verification");
      } else if (auth.currentUser && user?.locationValid && user?.locationValid === false) {
        navigate("/Illegal-State");
      } else if (auth.currentUser && user?.ageValid && user?.ageValid === false) {
        navigate("/Illegal-Age");
      } else if (auth.currentUser && user?.accountStatus && user?.accountStatus === "suspended") {
        navigate("/Account-Suspended");
      }

    };
    routeUser();
  }, [loading, user, navigate, unprotectedRoutes]);

  // Check terms of service and privacy policy versions
  useEffect(() => {
    const fetchAgreementsOncePerDay = async () => {
      // Attempt to load from localStorage
      let storedPrivacyPolicy = localStorage.getItem("privacyPolicy");
      let storedTermsOfService = localStorage.getItem("termsOfService");
      if (storedPrivacyPolicy) {
        storedPrivacyPolicy = JSON.parse(storedPrivacyPolicy);
      }
      if (storedTermsOfService) {
        storedTermsOfService = JSON.parse(storedTermsOfService);
      }

      // Calculate today's date in "YYYY-MM-DD" format
      const today = new Date().toISOString().split("T")[0];

      // If both objects are stored, check their `date_created` fields
      if (
        storedPrivacyPolicy &&
        storedTermsOfService &&
        storedPrivacyPolicy?.lastAccessedByUser === today &&
        storedTermsOfService?.lastAccessedByUser === today
      ) {
        // Use cached versions
        setPrivacyPolicyVersion(parseInt(storedPrivacyPolicy.version, 10));
        setTermsOfServiceVersion(parseInt(storedTermsOfService.version, 10));
      } else {
        // Fetch new versions from server
        let privacyPolicy = await getLatestPrivacyPolicy("privacy-policy");
        let termsOfService = await getLatestTermsOfService("terms-of-service");

        // Save to localStorage
        localStorage.setItem("privacyPolicy", JSON.stringify({lastAccessedByUser: today, ...privacyPolicy}));
        localStorage.setItem("termsOfService", JSON.stringify({lastAccessedByUser: today, ...termsOfService}));

        // Update state
        setPrivacyPolicyVersion(parseInt(privacyPolicy.version, 10));
        setTermsOfServiceVersion(parseInt(termsOfService.version, 10));
      }
    };

    fetchAgreementsOncePerDay();
  }, [navigate]);

  if (loading) {
    return <p>Loading...</p>;
  }

  const locationPermissionGranted = user?.locationPermissionGranted;
  const locationValid = user?.locationValid;
  const ageValid = user?.ageValid;
  const emailVerified = user?.emailVerificationStatus === "verified";
  const idvVerified = user?.idvStatus === "verified";
  const loggedIn = !loading && auth?.currentUser !== null && user?.mongoUserId !== null;
  const accountSuspended = user?.accountStatus === "suspended";
  const admin = loggedIn && user?.userType === "admin";
  const requirePp = loggedIn && user?.pp && parseInt(user?.pp.split("Accepted v")[1].split(" at")[0]) !== privacyPolicyVersion;
  const requireTos = loggedIn && user?.tos && parseInt(user?.tos.split("Accepted v")[1].split(" at")[0]) !== termsOfServiceVersion;

  return (
    <div style={styles.container}>
      
      <Navbar />
      
      <div>
        {loggedIn ? (
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
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Forgot-Password" element={<ForgotPassword />} />
        <Route path="/App-Outage" element={<AppOutage />} />
        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<PageNotFound />} />

        {/* Protected Routes */}
        <Route
          path="/Wagers"
          element={
            <PrivateRoute authorized={loggedIn}>
              <Wagers />
            </PrivateRoute>
          }
        />
        <Route
          path="/Create_Wager"
          element={
            <PrivateRoute authorized={loggedIn}>
              <CreateWager />
            </PrivateRoute>
          }
        />
        <Route
          path="/Profile"
          element={
            <PrivateRoute authorized={loggedIn}>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/Email-Verification"
          element={
            <PrivateRoute authorized={loggedIn && !emailVerified} redirectTo="/Wagers">
              <EmailVerification />
            </PrivateRoute>
          }
        />
        <Route
          path="/Identity-Verification"
          element={
            <PrivateRoute authorized={loggedIn && !idvVerified} redirectTo="/Wagers">
              <IdentityVerification />
            </PrivateRoute>
          }
        />
        <Route
          path="/Settings"
          element={
            <PrivateRoute authorized={loggedIn}>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/Credits"
          element={
            <PrivateRoute authorized={loggedIn}>
              <Credits />
            </PrivateRoute>
          }
        />
        <Route
          path="/Tournament-History"
          element={
            <PrivateRoute authorized={loggedIn}>
              <TournamentHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/Credit-Shop"
          element={
            <PrivateRoute authorized={loggedIn}>
              <CreditShop />
            </PrivateRoute>
          }
        />
        <Route
          path="/Lifetime-Leaderboard"
          element={
            <PrivateRoute authorized={loggedIn}>
              <LifetimeLeaderboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/Tournament-Leaderboard"
          element={
            <PrivateRoute authorized={loggedIn}>
              <CurrentTournamentLeaderboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/Tournament"
          element={
            <PrivateRoute authorized={loggedIn}>
              <CurrentTournament />
            </PrivateRoute>
          }
        />
        <Route
          path="/Illegal-State"
          element={
            <PrivateRoute authorized={loggedIn && !locationValid} redirectTo="/Wagers">
              <IllegalState />
            </PrivateRoute>
          }
        />
        <Route
          path="/Location-Permission-Required"
          element={
            <PrivateRoute authorized={loggedIn && !locationPermissionGranted} redirectTo="/Wagers">
              <LocationPermissionRequired />
            </PrivateRoute>
          }
        />
        <Route
          path="/Illegal-Age"
          element={
            <PrivateRoute authorized={loggedIn && !ageValid} redirectTo="/Wagers">
              <IllegalAge />
            </PrivateRoute>
          }
        />
        <Route
          path="/Account-Suspended"
          element={
            <PrivateRoute authorized={loggedIn && accountSuspended} redirectTo="/Wagers">
              <SuspendedUser />
            </PrivateRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="/Log"
          element={
            <PrivateRoute authorized={loggedIn && admin}>
              <Log />
            </PrivateRoute>
          }
        />
        <Route
          path="/Admin"
          element={
            <PrivateRoute authorized={loggedIn && admin}>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="/Admin-Email"
          element={
            <PrivateRoute authorized={loggedIn && admin}>
              <AdminEmail />
            </PrivateRoute>
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
