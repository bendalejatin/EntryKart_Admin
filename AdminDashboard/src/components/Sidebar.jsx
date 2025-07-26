// components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./styles/Sidebar.css";

const menuItems = [
  { path: "/", icon: "🏠", label: "Dashboard" },
  { path: "/society", icon: "🏢", label: "Society Management" },
  { path: "/users", icon: "👥", label: "User Management" },
  { path: "/coupons", icon: "🎟️", label: "Coupon Management" },
  { path: "/events", icon: "📅", label: "Event Management" },
  { path: "/broadcast", icon: "📢", label: "Broadcast Messages" },
  { path: "/flat-owner", icon: "🧾", label: "Flat Owner Management" },
  { path: "/entry-permission", icon: "🚪", label: "Entry Permission" },
  { path: "/maintenance", icon: "💸", label: "Maintenance" },
  { path: "/service-entries", icon: "📰", label: "Service Entries" },
  { path: "/vehicles", icon: "🚗", label: "Vehicle Management" }, // New menu item
  { path: "/profile", icon: "👤", label: "Profile" },
];

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  return (
    <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <ul>
        {menuItems.map(({ path, icon, label }) => (
          <li key={path} className={location.pathname === path ? "active" : ""}>
            <Link to={path}>
              <span className="icon">{icon}</span>
              {isOpen && <span className="label">{label}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;