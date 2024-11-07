import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
  const { firebaseUser, loading } = useAuth();

  // Display loading message if firebaseUser exists but mongoUserId hasn't loaded yet
  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Navbar />
      <div>
        {firebaseUser ? (
          <p>
            Welcome, User ID: {firebaseUser.uid} - MongoId:{" "}
            {firebaseUser.mongoUserId}
          </p>
        ) : (
          <p>Please log in</p>
        )}
      </div>
      <Routes>
        <Route path="/" element={firebaseUser ? <Home /> : <Auth />} />
        <Route path="/Auth" element={<Auth />} /> {/* Used for testing */}
        <Route path="/User" element={firebaseUser ? <User /> : <Auth />} />
        <Route path="/Create_Wager" element={firebaseUser ? <CreateWager /> : <Auth />} />
        <Route path="/Schedule" element={firebaseUser ? <Schedule /> : <Auth />} />
        <Route path="/Credits" element={firebaseUser ? <Credits /> : <Auth />} />
        <Route path="/Leaderboard" element={firebaseUser ? <Leaderboard /> : <Auth />} />
        <Route path="/Log" element={firebaseUser ? <Log /> : <Auth />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
