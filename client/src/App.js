import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebaseConfig";
import { usePageTracking } from "./services/firebaseService";
import {
  getMongoUserDataByFirebaseId,
  userAgeLegal,
  updateUser,
} from "./services/userService";
import {
  getLatestPrivacyPolicy,
  getLatestTermsOfService,
} from "./services/agreementService";
import { useUser } from "./contexts/UserContext";
import { Routes, Route, useNavigate } from "react-router-dom";
import Wagers from "./components/features/core/Wagers";
import Profile from "./components/features/core/Profile";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import CreateWager from "./components/features/admin/CreateWager";
import TournamentHistory from "./components/features/tournaments/TournamentHistory";
import CreditShop from "./components/features/core/CreditShop";
import LifetimeLeaderboard from "./components/features/leaderboards/LifetimeLeaderboard";
import CurrentTournamentLeaderboard from "./components/features/leaderboards/CurrentTournamentLeaderboard";
import Log from "./components/features/admin/Log";
import Admin from "./components/features/admin/Admin";
import EmailVerification from "./components/features/userVerification/EmailVerification";
import Credits from "./components/features/about/Credits";
import BugForm from "./components/features/feedback/BugForm";
import FeatureForm from "./components/features/feedback/FeatureForm";
import FeedbackForm from "./components/features/feedback/FeedbackForm";
import Hero from "./components/features/about/Hero";
import IllegalState from "./components/features/permissionFailure/IllegalState";
import LocationPermissionRequired from "./components/features/permissionFailure/LocationPermissionRequired";
import IllegalAge from "./components/features/permissionFailure/IllegalAge";
import SomethingWentWrong from "./components/features/errorHandling/SomethingWentWrong";
import AppOutage from "./components/features/errorHandling/AppOutage";
import CurrentTournament from "./components/features/tournaments/CurrentTournament";
import PrivacyPolicy from "./components/features/legal/PrivacyPolicy";
import TermsOfService from "./components/features/legal/TermsOfService";
import Agreements from "./components/features/legal/Agreements";
import PageNotFound from "./components/features/errorHandling/PageNotFound";
import SuspendedUser from "./components/features/permissionFailure/SuspendedUser";
import AdminEmail from "./components/features/admin/AdminEmail";
import PrivateRoute from "./components/features/routes/PrivateRoute";
import Signup from "./components/features/auth/Signup";
import Login from "./components/features/auth/Login";
import ForgotPassword from "./components/features/auth/ForgotPassword";
import AdminIdentityVerification from "./components/features/admin/AdminIdentityVerification";
import IdentityVerification from "./components/features/userVerification/IdentityVerification";
import SmsVerification from "./components/features/userVerification/SmsVerification";
import Instructions from "./components/features/core/Instructions";
import About from "./components/features/about/About";
import Contact from "./components/features/about/Contact";
import {
  checkGeolocationPermission,
  userLocationLegal,
} from "./services/locationService";
import Spinner from "./components/common/Spinner";

// Deprecated components
// import PlaidIdentityVerification from "./components/PlaidIdentityVerification"; Deprecated
// import OpenAiIdentityVerification from "./components/OpenAiIdentityVerification";

function App() {
  usePageTracking();
  const { user, setUser } = useUser();
  // eslint-disable-next-line
  const [unprotectedRoutes, setUnprotectedRoutes] = useState(
    process.env.REACT_APP_UNPROTECTED_ROUTES.split(",")
  );
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
          if (process.env.REACT_APP_ENV === "development")
            if (process.env.REACT_APP_ENV === "development")
              console.log("Firebase ID token:", idToken);
          if (!idToken) {
            if (process.env.REACT_APP_ENV === "development")
              console.warn("ID token not available");
            return;
          }

          // Fetch MongoDB user data
          const mongoUser = await getMongoUserDataByFirebaseId(
            firebaseUser.uid
          );

          if (process.env.REACT_APP_ENV === "development")
            console.log("Mongo User:", mongoUser);
          if (process.env.REACT_APP_ENV === "development")
            console.log("firebaseUser", firebaseUser);

          const userLocationMeta = await userLocationLegal();

          // Destructure the user object to remove the _id field
          const { _id, ...userWithoutId } = mongoUser;

          let userObj = {
            firebaseUserId: firebaseUser.uid,
            mongoUserId: _id,
            ...userWithoutId,
            locationValid: userLocationMeta?.allowed,
            currentState: userLocationMeta?.state,
            locationPermissionGranted: await checkGeolocationPermission(),
          };

          // Check if the user's age is valid
          if (mongoUser.ageValid === false && mongoUser.DOB) {
            const userAgeLegalBool = await userAgeLegal(
              userLocationMeta?.state,
              mongoUser.DOB
            );
            await updateUser(mongoUser._id, { ageValid: userAgeLegalBool });
            userObj.ageValid = userAgeLegalBool;
          }

          // Set the user state with the updated user object
          setUser(userObj);
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

  // Get a potential referral code from the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get("ref");

    if (referralCode) {
      // Save the referral code in localStorage or state
      localStorage.setItem("referralCode", referralCode);

      // Optionally navigate to a specific route or process the referral code
      navigate("/signup");
    }
  }, [navigate]);

  // Reroute users to the appropriate page based on their permission states
  useEffect(() => {
    const routeUser = async () => {
      // If still loading, do nothing
      if (loading || auth?.currentUser === null || user?.mongoUserId === null) {
        return;
      }

      if (process.env.REACT_APP_ENV === "development")
        console.log("User:", user);

      // Check current path
      const currentPath = window.location.pathname;

      // Allow all users to access unprotected routes
      if (unprotectedRoutes.includes(currentPath)) {
        return;
      }

      // If user has not verified email or IDV, redirect to respective pages
      if (auth.currentUser && user?.locationPermissionGranted === false) {
        navigate("/location-permission-required");
      } else if (
        auth.currentUser &&
        user?.emailVerificationStatus &&
        user?.emailVerificationStatus !== "verified"
      ) {
        navigate("/email-verification");
      } else if (
        auth.currentUser &&
        !user?.phoneNumber &&
        user?.smsVerificationStatus &&
        user?.smsVerificationStatus !== "verified"
      ) {
        navigate("/sms-verification");
      } else if (
        auth.currentUser &&
        user?.idvStatus &&
        ["review", "unverified"].includes(user?.idvStatus)
      ) {
        navigate("/identity-verification");
      } else if (
        auth.currentUser &&
        (user?.pp.version !== privacyPolicyVersion ||
          user.tos.version !== termsOfServiceVersion)
      ) {
        navigate("/agreements");
      } else if (auth.currentUser && user?.locationValid === false) {
        navigate("/illegal-state");
      } else if (auth.currentUser && user?.ageValid === false) {
        navigate("/illegal-age");
      } else if (
        auth.currentUser &&
        user?.accountStatus &&
        user?.accountStatus === "suspended"
      ) {
        navigate("/account-suspended");
      } else if (auth.currentUser && user?.viewedInstructions === false) {
        navigate("/instructions");
      }
    };
    routeUser();
  }, [
    loading,
    user,
    navigate,
    unprotectedRoutes,
    privacyPolicyVersion,
    termsOfServiceVersion,
  ]);

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
        let privacyPolicy = await getLatestPrivacyPolicy();
        let termsOfService = await getLatestTermsOfService();

        // Save to localStorage
        localStorage.setItem(
          "privacyPolicy",
          JSON.stringify({ lastAccessedByUser: today, ...privacyPolicy })
        );
        localStorage.setItem(
          "termsOfService",
          JSON.stringify({ lastAccessedByUser: today, ...termsOfService })
        );

        // Update state
        setPrivacyPolicyVersion(parseInt(privacyPolicy.version, 10));
        setTermsOfServiceVersion(parseInt(termsOfService.version, 10));
      }
    };

    fetchAgreementsOncePerDay();
  }, [navigate]);

  if (loading) {
    return <Spinner />;
  }

  const locationPermissionGranted = user?.locationPermissionGranted;
  const locationValid = user?.locationValid;
  const ageValid = user?.ageValid;
  const emailVerified = user?.emailVerificationStatus === "verified";
  const idvVerified = user?.idvStatus === "verified";
  const smsVerified = user?.smsVerificationStatus === "verified";
  const loggedIn =
    !loading && auth?.currentUser !== null && user?.mongoUserId !== null;
  const accountSuspended = user?.accountStatus === "suspended";
  const admin = loggedIn && user?.userType === "admin";
  const requirePp =
    loggedIn && user?.pp && user?.pp.version !== privacyPolicyVersion;
  const requireTos =
    loggedIn && user?.tos && user.tos.version !== termsOfServiceVersion;

  return (
    <div className="App">
      <Navbar />
      <div className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Hero />} />
          <Route path="/whoopsie-daisy" element={<SomethingWentWrong />} />
          <Route path="/bug-form" element={<BugForm />} />
          <Route path="/feature-form" element={<FeatureForm />} />
          <Route path="/feedback-form" element={<FeedbackForm />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/app-outage" element={<AppOutage />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<PageNotFound />} />

          {/* Protected Routes */}
          <Route
            path="/wagers"
            element={
              <PrivateRoute authorized={loggedIn}>
                <Wagers />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-wager"
            element={
              <PrivateRoute authorized={loggedIn}>
                <CreateWager />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute authorized={loggedIn}>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/email-verification"
            element={
              <PrivateRoute
                authorized={loggedIn && !emailVerified}
                redirectTo="/wagers"
              >
                <EmailVerification />
              </PrivateRoute>
            }
          />
          <Route
            path="/identity-verification"
            element={
              <PrivateRoute
                authorized={loggedIn && !idvVerified}
                redirectTo="/wagers"
              >
                <IdentityVerification />
              </PrivateRoute>
            }
          />
          <Route
            path="/sms-verification"
            element={
              <PrivateRoute
                authorized={loggedIn && !smsVerified}
                redirectTo="/wagers"
              >
                <SmsVerification />
              </PrivateRoute>
            }
          />
          <Route
            path="/agreements"
            element={
              <PrivateRoute
                authorized={loggedIn && (requireTos || requirePp)}
                redirectTo="/wagers"
              >
                <Agreements />
              </PrivateRoute>
            }
          />
          <Route
            path="/credits"
            element={
              <PrivateRoute authorized={loggedIn}>
                <Credits />
              </PrivateRoute>
            }
          />
          <Route
            path="/tournament-history"
            element={
              <PrivateRoute authorized={loggedIn}>
                <TournamentHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/credit-shop"
            element={
              <PrivateRoute authorized={loggedIn}>
                <CreditShop />
              </PrivateRoute>
            }
          />
          <Route
            path="/lifetime-leaderboard"
            element={
              <PrivateRoute authorized={loggedIn}>
                <LifetimeLeaderboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/tournament-leaderboard"
            element={
              <PrivateRoute authorized={loggedIn}>
                <CurrentTournamentLeaderboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/tournament"
            element={
              <PrivateRoute authorized={loggedIn}>
                <CurrentTournament />
              </PrivateRoute>
            }
          />
          <Route
            path="/illegal-state"
            element={
              <PrivateRoute
                authorized={loggedIn && !locationValid}
                redirectTo="/wagers"
              >
                <IllegalState />
              </PrivateRoute>
            }
          />
          <Route
            path="/location-permission-required"
            element={
              <PrivateRoute
                authorized={loggedIn && !locationPermissionGranted}
                redirectTo="/wagers"
              >
                <LocationPermissionRequired />
              </PrivateRoute>
            }
          />
          <Route
            path="/illegal-age"
            element={
              <PrivateRoute
                authorized={loggedIn && !ageValid}
                redirectTo="/wagers"
              >
                <IllegalAge />
              </PrivateRoute>
            }
          />
          <Route
            path="/account-suspended"
            element={
              <PrivateRoute
                authorized={loggedIn && accountSuspended}
                redirectTo="/wagers"
              >
                <SuspendedUser />
              </PrivateRoute>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/log"
            element={
              <PrivateRoute authorized={loggedIn && admin}>
                <Log />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute authorized={loggedIn && admin}>
                <Admin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-email"
            element={
              <PrivateRoute authorized={loggedIn && admin}>
                <AdminEmail />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-identity-verification"
            element={
              <PrivateRoute authorized={loggedIn && admin}>
                <AdminIdentityVerification />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
      <Footer />
      <div id="recaptcha-container" style={{ display: "none" }}></div>
    </div>
  );
}

export default App;
