import React, { useState } from "react";
import axios from "axios";
import "./styles/Auth.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage("❌ Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="auth-container">
      <h2>🔑 Forgot Password</h2>
      <form onSubmit={handleForgotPassword}>
        <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Send Reset Link</button>
      </form>
      <p>{message}</p>
      <p>
        <a href="/admin/login">Back to Login</a>
      </p>
    </div>
  );
};

export default AdminForgotPassword;
