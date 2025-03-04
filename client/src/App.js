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
      if (auth.currentUser && user?.locationPermissionGranted === false) {
        navigate("/Location-Permission-Required");
      } else if (
        auth.currentUser &&
        user?.emailVerificationStatus &&
        user?.emailVerificationStatus !== "verified"
      ) {
        navigate("/Email-Verification");
      } else if (
        auth.currentUser &&
        !user?.phoneNumber &&
        user?.smsVerificationStatus &&
        user?.smsVerificationStatus !== "verified"
      ) {
        navigate("/SMS-Verification");
      } else if (
        auth.currentUser &&
        user?.idvStatus &&
        ["review", "unverified"].includes(user?.idvStatus)
      ) {
        navigate("/Identity-Verification");
      } else if (
        auth.currentUser &&
        (user?.pp.version !== privacyPolicyVersion ||
          user.tos.version !== termsOfServiceVersion)
      ) {
        navigate("/Agreements");
      } else if (auth.currentUser && user?.locationValid === false) {
        navigate("/Illegal-State");
      } else if (auth.currentUser && user?.ageValid === false) {
        navigate("/Illegal-Age");
      } else if (
        auth.currentUser &&
        user?.accountStatus &&
        user?.accountStatus === "suspended"
      ) {
        navigate("/Account-Suspended");
      } else if (auth.currentUser && user?.viewedInstructions === false) {
        navigate("/Instructions");
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
        let privacyPolicy = await getLatestPrivacyPolicy("privacy-policy");
        let termsOfService = await getLatestTermsOfService("terms-of-service");

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
    return <span class="loader"></span>;
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
          <Route path="/Instructions" element={<Instructions />} />
          <Route path="/About" element={<About />} />
          <Route path="/Contact" element={<Contact />} />
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
              <PrivateRoute
                authorized={loggedIn && !emailVerified}
                redirectTo="/Wagers"
              >
                <EmailVerification />
              </PrivateRoute>
            }
          />
          <Route
            path="/Identity-Verification"
            element={
              <PrivateRoute
                authorized={loggedIn && !idvVerified}
                redirectTo="/Wagers"
              >
                <IdentityVerification />
              </PrivateRoute>
            }
          />
          <Route
            path="/SMS-Verification"
            element={
              <PrivateRoute
                authorized={loggedIn && !smsVerified}
                redirectTo="/Wagers"
              >
                <SmsVerification />
              </PrivateRoute>
            }
          />
          <Route
            path="/Agreements"
            element={
              <PrivateRoute
                authorized={loggedIn && (requireTos || requirePp)}
                redirectTo="/Wagers"
              >
                <Agreements />
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
              <PrivateRoute
                authorized={loggedIn && !locationValid}
                redirectTo="/Wagers"
              >
                <IllegalState />
              </PrivateRoute>
            }
          />
          <Route
            path="/Location-Permission-Required"
            element={
              <PrivateRoute
                authorized={loggedIn && !locationPermissionGranted}
                redirectTo="/Wagers"
              >
                <LocationPermissionRequired />
              </PrivateRoute>
            }
          />
          <Route
            path="/Illegal-Age"
            element={
              <PrivateRoute
                authorized={loggedIn && !ageValid}
                redirectTo="/Wagers"
              >
                <IllegalAge />
              </PrivateRoute>
            }
          />
          <Route
            path="/Account-Suspended"
            element={
              <PrivateRoute
                authorized={loggedIn && accountSuspended}
                redirectTo="/Wagers"
              >
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
          <Route
            path="/Admin-Identity-Verification"
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
