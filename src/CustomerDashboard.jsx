import React from "react";
import "./CustomerDashboard.css";

function CustomerDashboard() {
  // Example logout handler
  const handleLogoutClick = () => {
    // You can clear auth tokens, redirect, or show a message
    alert("Logged out successfully!");
    // Example: redirect to login page
    // window.location.href = "/login";
  };

  return (
    <div className="customerdashboard">
      {/* Top Navigation Bar */}
      <div className="navbar">
        <img src="/logo1.png" className="logo" alt="Logo" />
        <button className="logout-btn" onClick={handleLogoutClick}>
      Log-out
    </button>
        </div>
      

      {/* Dashboard Content */}
      <main className="dashboard-content">
        <h1>Welcome Customer Portal</h1>
      </main>
    </div>
  );
}

export default CustomerDashboard;
