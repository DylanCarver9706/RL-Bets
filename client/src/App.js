import React from "react";
import { Routes, Route } from "react-router-dom";
import { useUser, UserProvider } from "./context/UserContext";
import Home from "./components/Home";
import Auth from "./components/Auth";
import User from "./components/User";
import Navbar from "./components/Navbar";
import CreateWager from "./components/CreateWager";
import Schedule from "./components/Schedule";
import Credits from "./components/Credits";
import Leaderboard from "./components/Leaderboard";
import Log from "./components/Log";

function AppRoutes() {
  const { firebaseUser, mongoUserId, loading } = useUser();

  // Show a loading screen until Firebase finishes checking the auth state
  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={firebaseUser ? <Home /> : <Auth />} />
        <Route path="/Auth" element={<Auth />} />
        <Route path="/User" element={mongoUserId ? <User /> : <Auth />} />
        <Route path="/Create_Wager" element={mongoUserId ? <CreateWager /> : <Auth />} />
        <Route path="/Schedule" element={mongoUserId ? <Schedule /> : <Auth />}/>
        <Route path="/Credits" element={mongoUserId ? <Credits /> : <Auth />} />
        <Route path="/Leaderboard" element={mongoUserId ? <Leaderboard /> : <Auth />} />
        <Route path="/Log" element={mongoUserId ? <Log /> : <Auth />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;
