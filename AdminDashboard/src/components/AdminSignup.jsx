import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Auth.css";

//const BASE_URL = "http://localhost:5000"; // Adjust this to your backend URL
const BASE_URL = "https://entrykart-admin.onrender.com" ; // deployment url

const AdminSignup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");  // ✅ Added phone field
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // ✅ Ensure all fields are included in the request
      await axios.post(`${BASE_URL}/api/auth/signup`, {  
        name, 
        email, 
        password, 
        phone // ✅ Sending phone along with other details
      });
      alert("✅ Signup successful! Please log in.");
      navigate("/admin/login");
    } catch (error) {
      alert("❌ Signup failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="auth-container">
      <h2>📝 Admin Signup</h2>
      <form onSubmit={handleSignup}>
        <input 
          type="text" 
          placeholder="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <input 
          type="tel"  // ✅ Input type changed to tel for phone number
          placeholder="Phone Number" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          required 
        />
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <a href="/admin/login">Login Here</a></p>
    </div>
  );
};

export default AdminSignup;
