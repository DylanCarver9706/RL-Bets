import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getMongoUserDataByFirebaseId } from "./services/userService";
import { useUser } from "./context/UserContext";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./components/Home";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";
import CreateWager from "./components/CreateWager";
import Schedule from "./components/Schedule";
import Credits from "./components/Credits";
import Leaderboard from "./components/Leaderboard";
import Log from "./components/Log";
import Admin from "./components/Admin";
import EmailVerification from "./components/EmailVerification";
import IdentityVerification from "./components/IdentityVerification";

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
          console.log("ID token:", idToken);
          if (!idToken) {
            console.warn("ID token not available");
            setLoading(false);
            return;
          }

          console.log("firebaseUser", firebaseUser)

          // Fetch MongoDB user data
          const mongoUser = await getMongoUserDataByFirebaseId(firebaseUser.uid);
          console.log("Mongo User:", mongoUser);
          setUser({
            firebaseUserId: firebaseUser.uid,
            mongoUserId: mongoUser?._id,
            userType: mongoUser?.type,
            idvStatus: mongoUser?.idvStatus,
            emailVerificationStatus: mongoUser?.emailVerificationStatus,
            credits: mongoUser?.credits,
            email: mongoUser?.email,
            name: mongoUser?.name,
          });

        } catch {
        }
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
    if (!user || !user?.emailVerificationStatus || !user?.idvStatus) {
      return;
    }
    if (user?.emailVerificationStatus !== "verified") {
      navigate("/Email-Verification");
    } else if (user?.idvStatus !== "verified") {
      navigate("/Identity-Verification");
    }
  }, [user, navigate]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      { user && (<Navbar />)} 
      <div>
        {user ? (
          <p>
            Welcome, Firebase UID: {user?.firebaseUserId} - MongoId: {user?.mongoUserId} - Email Verification Status: {user?.emailVerificationStatus} - IDV Status: {user?.idvStatus}
          </p>
        ) : (
          <p>Please log in</p>
        )}
      </div>
      <Routes>
        <Route path="/" element={user?.emailVerificationStatus === "verified" && user?.idvStatus === "verified" ? <Home /> : <Auth /> } />
        <Route path="/Auth" element={user ? <Home /> : <Auth />} />
        <Route path="/Email-Verification" element={user ? <EmailVerification /> : <Home />} />
        <Route path="/Identity-Verification" element={user ? <IdentityVerification /> : <Home />} />
        <Route path="/Profile" element={user ? <Profile /> : <Auth />} />
        <Route path="/Create_Wager" element={user ? <CreateWager /> : <Auth />} />
        <Route path="/Schedule" element={user ? <Schedule /> : <Auth />} />
        <Route path="/Credits" element={user ? <Credits /> : <Auth />} />
        <Route path="/Leaderboard" element={user ? <Leaderboard /> : <Auth />} />
        <Route path="/Log" element={user?.userType === "admin" ? <Log /> : <Home />} />
        <Route path="/Admin" element={user?.userType === "admin" ? <Admin /> : <Home />} />
      </Routes>
    </>
  );
}

export default App;
