// src/CustomerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // navigation
import foodItems from "./FoodData";
import "./CustomerDashboard.css";

function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("Guntur");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const stores = ["Guntur", "Vijayawada", "Hyderabad"];

  // ✅ Load username from localStorage when page loads
  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) {
      setUsername(user);
    } else {
      navigate("/"); // redirect if not logged in
    }
  }, [navigate]);

  // ✅ Logout function
  const handleLogoutClick = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("customerId"); // optional
    alert("Logged out successfully!");
    navigate("/"); // redirect to home
  };

  // ✅ Filter search
  const filteredFood = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customerdashboard">
      {/* Top Navigation Bar */}
      <div className="navbar">
        <img src="/ai-food-management/logo1.png" className="logo" alt="Logo" />

        {/* Store Selector + Search Bar */}
        <div className="search-store-container">
          <select
            className="store-select"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            {stores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>

          <input
            type="text"
            className="search-input"
            placeholder="Search food..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Search suggestions dropdown */}
          {searchTerm && filteredFood.length > 0 && (
            <div className="search-dropdown">
              {filteredFood.map(item => (
                <div className="search-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Username and Logout */}
        <div className="user-section">
          <span className="username-display">👤 {username}</span>
          <button className="logout-btn" onClick={handleLogoutClick}>
            Log-out
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="dashboard-content">
        <h1>Welcome, {username}!</h1>
        <p>Explore our food menu and enjoy!</p>
      </main>
    </div>
  );
}

export default CustomerDashboard;
