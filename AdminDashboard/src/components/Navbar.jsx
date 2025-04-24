import React from "react";
import "./styles/Navbar.css";

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="navbar">
      <button className="toggle-btn" onClick={toggleSidebar}>☰</button>
      <h1>Admin Dashboard</h1>
    </nav>
  );
};

export default Navbar;
