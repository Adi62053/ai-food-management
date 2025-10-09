import React from "react";
import "./AdminDashboard.css"; // or rename to AdminDashboard.css for consistency

function AdminDashboard() {
  const handleLogoutClick = () => {
    alert("Logged out successfully!");
    // Example: redirect to login page
    // window.location.href = "/login";
  };

  return (
    <div className="admin-dashboard">
      <div className="navbar">
      <img src="/ai-food-management/logo1.png" className="logo" alt="Logo" />
        <button className="logout-btn" onClick={handleLogoutClick}>
      Log-out
    </button>
        </div>

      <main className="dashboard-content">
        <h1>Welcome Admin Portal</h1>
      </main>
    </div>
  );
}

export default AdminDashboard;
