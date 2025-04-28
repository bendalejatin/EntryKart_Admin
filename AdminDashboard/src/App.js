import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import SocietyManagement from "./components/SocietyManagement";
import UserManagement from "./components/UserManagement";
import EventManagement from "./components/EventManagement";
import CouponManagement from "./components/CouponManagement";
import QRScanner from "./components/QRScanner";
import AdminProfile from "./components/AdminProfile";
import AdminLogin from "./components/AdminLogin";
import AdminSignup from "./components/AdminSignup";
import AdminForgotPassword from "./components/AdminForgotPassword";
import AdminResetPassword from "./components/AdminResetPassword";
import BroadcastMessage from "./components/BroadcastMessage";
import FlatOwnerDetails from "./components/FlatOwnerDetails";
import EntryPermissionForm from "./components/EntryPermissionForm";
import Maintenance from "./components/Maintenance";
import "./App.css";

// ✅ Protected Route Function
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin/login" />;
};

const App = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    setIsLoggedIn(!!token);
  }, []);

  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('https://dec-entrykart-backend.onrender.com/health');
        if (res.ok) {
          setServerReady(true);
        }
      } catch (err) {
        console.log('Server not ready yet...');
        setTimeout(checkServer, 2000); // retry every 2 seconds
      }
    };
    checkServer();
  }, []);

  if (!serverReady) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Starting server... Please wait 🔥</h2>
      </div>
    );
  }

  return (
    <Router>
      {isLoggedIn && (
        <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      )}
      <div className="main">
        {isLoggedIn && <Sidebar isOpen={isSidebarOpen} />}
        <div className="content">
          <Routes>
            {/* Auth Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route
              path="/admin/forgot-password"
              element={<AdminForgotPassword />}
            />
            <Route
              path="/reset-password/:token"
              element={<AdminResetPassword />}
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/society"
              element={
                <ProtectedRoute>
                  <SocietyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coupons"
              element={
                <ProtectedRoute>
                  <CouponManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qrscanner"
              element={
                <ProtectedRoute>
                  <QRScanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AdminProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/broadcast"
              element={
                <ProtectedRoute>
                  <BroadcastMessage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flat-owner"
              element={
                <ProtectedRoute>
                  <FlatOwnerDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/entry-permission"
              element={
                <ProtectedRoute>
                  <EntryPermissionForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute>
                  <Maintenance />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Route */}
            <Route path="*" element={<Navigate to="/admin/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
