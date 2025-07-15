import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/Auth.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const AdminResetPassword = () => {
  const { token } = useParams(); // ✅ Get token from URL
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password`, { token, newPassword });
      alert("✅ Password updated successfully! Please log in.");
      navigate("/admin/login");
    } catch (error) {
      setMessage("❌ Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="auth-container">
      <h2>🔒 Reset Password</h2>
      <form onSubmit={handleResetPassword}>
        <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <button type="submit">Reset Password</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default AdminResetPassword;
