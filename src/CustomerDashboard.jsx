// src/CustomerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import foodItems from "./FoodData";
import "./CustomerDashboard.css";

function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("Guntur");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const stores = ["Guntur", "Vijayawada", "Hyderabad"];

  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) {
      setUsername(user);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleLogoutClick = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("customerId");
    alert("Logged out successfully!");
    navigate("/");
  };

  const filteredFood = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customer-dashboard">
      {/* Top Navigation Bar */}
      <div className="customer-navbar">
        <img src="/ai-food-management/logo1.png" className="customer-logo" alt="Logo" />

        {/* Store Selector + Search Bar */}
        <div className="customer-search-container">
          <select
            className="customer-store-select"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            {stores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>

          <input
            type="text"
            className="customer-search-input"
            placeholder="Search food..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && filteredFood.length > 0 && (
            <div className="customer-search-dropdown">
              {filteredFood.map(item => (
                <div className="customer-search-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Username and Logout - Side by Side */}
        <div className="customer-user-section">
          <span className="customer-username">👤 {username}</span>
          <button className="customer-logout-btn" onClick={handleLogoutClick}>
            Log-out
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="customer-dashboard-content">
        <h1>Welcome, {username}!</h1>
        <p>Explore our food menu and enjoy!</p>
      </main>
    </div>
  );
}

export default CustomerDashboard;