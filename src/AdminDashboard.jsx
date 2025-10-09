import React from "react";
import "./AdminDashboard.css";

function AdminDashboard() {
  const handleLogoutClick = () => {
    localStorage.removeItem("username");
    alert("Logged out successfully!");
    window.location.href = "/";
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-navbar">
        <img src="/ai-food-management/logo1.png" className="admin-logo" alt="Logo" />
        <button className="admin-logout-btn" onClick={handleLogoutClick}>
          Log-out
        </button>
      </div>

      <main className="admin-dashboard-content">
        <h1>Welcome Admin Portal</h1>
      </main>
    </div>
  );
}

export default AdminDashboard;