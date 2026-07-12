// src/explore/components/pages/SecondNav.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./SecondNav.css";

const SecondNav = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState({
    username: "",
    profilePic: "",
  });

  const navigate = useNavigate();

  // Load user info from JWT
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      setUser({
        username: decoded.username || "User",
        profilePic: decoded.profilePic || "/default-avatar.png",
      });
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Left Menu */}
      <div className="nav-left">
        <span className="nav-item" onClick={() => navigate("/")}>
          Home
        </span>

        <span className="nav-item" onClick={() => navigate("/courses")}>
          Courses
        </span>

        <span className="nav-item" onClick={() => navigate("/search")}>
          Search
        </span>
      </div>

      {/* Right Profile Section */}
      <div className="nav-right">
        <div
          className="profile"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <img
            src={user.profilePic || "/default-avatar.png"}
            alt="Profile"
            style={{
              width: "35px",
              height: "35px",
              borderRadius: "50%",
              objectFit: "cover",
              marginRight: "8px",
              border: "1px solid #007bff",
            }}
          />

          <span>{user.username || "Profile"} ⬇</span>

          {showProfileMenu && (
            <div className="profile-menu">
              <div onClick={() => navigate("/profile")}>View Profile</div>
              <div onClick={() => navigate("/dashboard")}>Dashboard</div>
              <div onClick={handleLogout}>Logout</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default SecondNav;