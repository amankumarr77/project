import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signin from "./components/signin";
import Signup from "./components/signup";
import Navbar from "./components/navbar";
import Profile from "./components/profile";
import Portfolio from './components/portfolio';
import Leaderboard from './components/leaderboard';
import LandingPage from './components/landingpage';
import Friends from './components/friends';

function RequireAuth({ children }) {
  const isAuth = !!localStorage.getItem("token");
  return isAuth ? children : <Navigate to="/signin" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ paddingTop: 76 /* leave room for fixed navbar */ }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
          <Route path="/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/search/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>}/>
          <Route path="/friends" element={<RequireAuth><Friends /></RequireAuth>}/>
          <Route path="/leaderboard/portfolio" element={<RequireAuth><Portfolio /></RequireAuth>}/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
