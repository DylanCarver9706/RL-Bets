import React from "react";
import { Routes, Route } from "react-router-dom";
import { useUser, UserProvider } from "./context/UserContext";
import Home from "./components/Home";
import Auth from "./components/Auth";
import User from "./components/User";
import Navbar from "./components/Navbar";

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
