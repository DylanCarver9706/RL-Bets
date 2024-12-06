import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getMongoUserDataByFirebaseId } from "./services/userService";
import { useUser } from "./context/UserContext";
import { Routes, Route } from "react-router-dom";
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

function App() {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
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

          console.log(user)

          // Fetch MongoDB user data
          const mongoUser = await getMongoUserDataByFirebaseId(firebaseUser.uid);
          setUser({
            firebaseUserId: firebaseUser.uid,
            mongoUserId: mongoUser?._id || null,
            userType: mongoUser?.type || null,
            idvStatus: mongoUser?.idvStatus || "unverified",
            credits: mongoUser?.credits || 0,
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
  }, [setUser]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Navbar />
      <div>
        {user ? (
          <p>
            Welcome, Firebase UID: {user.firebaseUserId} - MongoId: {user.mongoUserId} - IDV Status: {user?.idvStatus}
          </p>
        ) : (
          <p>Please log in</p>
        )}
      </div>
      <Routes>
        <Route path="/" element={user?.idvStatus === "verified" ? <Home /> : <Auth />} />
        <Route path="/Auth" element={<Auth />} />
        <Route path="/Profile" element={user ? <Profile /> : <Auth />} />
        <Route
          path="/Create_Wager"
          element={user?.idvStatus === "verified" ? <CreateWager /> : <Auth />}
        />
        <Route path="/Schedule" element={user?.idvStatus === "verified" ? <Schedule /> : <Auth />} />
        <Route path="/Credits" element={user?.idvStatus === "verified" ? <Credits /> : <Auth />} />
        <Route
          path="/Leaderboard"
          element={user?.idvStatus === "verified" ? <Leaderboard /> : <Auth />}
        />
        <Route path="/Log" element={user?.userType === "admin" ? <Log /> : <Home />} />
        <Route path="/Admin" element={user?.userType === "admin" ? <Admin /> : <Home />} />
      </Routes>
    </>
  );
}

export default App;
