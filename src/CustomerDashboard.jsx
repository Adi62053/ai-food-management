// src/CustomerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerDashboard.css";
import foodItems from "./FoodData";
import vijayawadaItems from "./VijayawadaData";
import hyderabadItems from "./HyderabadData";

function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("Select a store");
  const [username, setUsername] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [availableDishes, setAvailableDishes] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [portionRecommendation, setPortionRecommendation] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [customerStats, setCustomerStats] = useState({ wasteReduced: 0, totalOrders: 0, moneySaved: 0 });
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
  const [activeTab, setActiveTab] = useState("menu");
  const navigate = useNavigate();

  const stores = ["Select a store", "Guntur", "Vijayawada", "Hyderabad"];

  // ==================== STORE-SPECIFIC DISHES DATA ====================
  
  const gunturDishes = foodItems;
  const vijayawadaDishes = vijayawadaItems;
  const hyderabadDishes = hyderabadItems;

  // ==================== STORE DISHES MAPPING ====================
  const storeDishesMap = {
    "Guntur": gunturDishes,
    "Vijayawada": vijayawadaDishes,
    "Hyderabad": hyderabadDishes
  };

  // ==================== ALL DISHES FOR SEARCH (NEW) ====================
  const allDishes = [
    ...gunturDishes.map(dish => ({ ...dish, store: "Guntur" })),
    ...vijayawadaDishes.map(dish => ({ ...dish, store: "Vijayawada" })),
    ...hyderabadDishes.map(dish => ({ ...dish, store: "Hyderabad" }))
  ];

  useEffect(() => {
    const user = localStorage.getItem("username");
    const id = localStorage.getItem("customerId");
    
    if (user && id) {
      setUsername(user);
      setCustomerId(id);
      loadCustomerStats(id);
    } else {
      navigate("/");
    }
  }, [navigate]);

  // ==================== DISH MANAGEMENT FUNCTIONS ====================

  // 1️⃣ Load available dishes based on selected store
  const loadAvailableDishes = () => {
    if (selectedStore !== "Select a store") {
      const dishes = storeDishesMap[selectedStore] || [];
      setAvailableDishes(dishes);
    } else {
      setAvailableDishes([]);
    }
  };

  // Update dishes when store changes
  useEffect(() => {
    loadAvailableDishes();
  }, [selectedStore]);

  // 2️⃣ Filter dishes for search (ACROSS ALL STORES)
  const filteredFood = searchTerm ? allDishes.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // 3️⃣ Handle dish selection from search dropdown (NEW LOGIC)
  const handleDishSelect = (dish) => {
    // Switch to the store where this dish is available
    setSelectedStore(dish.store);
    
    // Find the dish in the selected store's menu
    const storeDishes = storeDishesMap[dish.store];
    const actualDish = storeDishes.find(d => d.id === dish.id);
    
    setSelectedDish(actualDish);
    getPortionRecommendation(actualDish.id);
    checkDishStock(actualDish.id);
    setSearchTerm(""); // Clear search after selection
  };

  // 4️⃣ See AI recommended portion (mock function)
  const getPortionRecommendation = async (dishId) => {
    const dish = availableDishes.find(d => d.id === dishId);
    let recommendation = "";
    
    if (dish.category === "Main Course") {
      recommendation = "🤖 AI suggests: 1 portion (perfect for one person) - 15% discount!";
    } else if (dish.category === "Snacks" || dish.category === "Dessert") {
      recommendation = "🤖 AI suggests: 2 portions (great for sharing) - 20% discount!";
    } else if (dish.category === "Seafood") {
      recommendation = "🤖 AI suggests: Half portion (reduce waste) - 25% discount!";
    } else {
      recommendation = "🤖 AI suggests: 1 portion (optimal serving) - 10% discount!";
    }
    
    setPortionRecommendation(recommendation);
    setOrderQuantity(1);
  };

  // 5️⃣ Low-stock alerts (mock function)
  const checkDishStock = async (dishId) => {
    const isLowStock = Math.random() > 0.75;
    if (isLowStock) {
      setStockStatus("⚠️ Low Stock: Only a few left! Order soon.");
    } else {
      setStockStatus("✅ In Stock: Plenty available");
    }
  };

  // 6️⃣ Place order (mock function)
  const submitOrder = async (dishId, quantity) => {
    try {
      const dish = availableDishes.find(d => d.id === dishId);
      const discount = 0.15;
      const finalPrice = dish.price * quantity * (1 - discount);
      
      alert(`✅ Order placed successfully!\n${quantity}x ${dish.name}\nOriginal: ₹${dish.price * quantity}\nAfter AI Discount: ₹${finalPrice.toFixed(2)}\nYou saved: ₹${(dish.price * quantity * discount).toFixed(2)}`);
      
      setCustomerStats(prev => ({
        ...prev,
        totalOrders: prev.totalOrders + 1,
        wasteReduced: prev.wasteReduced + (0.3 * quantity),
        moneySaved: prev.moneySaved + (dish.price * quantity * discount)
      }));
      
      setSelectedDish(null);
    } catch (error) {
      alert("❌ Failed to place order");
    }
  };

  // 7️⃣ Feedback on portions/wastage (mock function)
  const submitFeedback = async (dishId, rating, comment) => {
    const dish = availableDishes.find(d => d.id === dishId);
    alert(`📝 Thank you for your feedback on ${dish.name}! This helps us reduce food waste.`);
    setFeedback({ rating: 5, comment: "" });
  };

  // 8️⃣ Wastage reduction info (mock function)
  const loadCustomerStats = async (customerId) => {
    setCustomerStats({
      wasteReduced: 2.5,
      totalOrders: 8,
      moneySaved: 240
    });
  };

  const handleLogoutClick = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("customerId");
    alert("Logged out successfully!");
    navigate("/");
  };

  // Get store description
  const getStoreDescription = (store) => {
    const descriptions = {
      "Guntur": "🔥 Authentic Andhra Cuisine - Famous for spicy non-veg dishes and traditional flavors",
      "Vijayawada": "🌊 Coastal Specialties - Fresh seafood and authentic vegetarian meals",
      "Hyderabad": "👑 Royal Hyderabadi Cuisine - Famous for biryanis and Mughlai dishes"
    };
    return descriptions[store] || "Select a store to view available dishes";
  };

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
            placeholder="Search food across all stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Search suggestions dropdown - WORKS ACROSS ALL STORES */}
          {searchTerm && filteredFood.length > 0 && (
            <div className="customer-search-dropdown">
              <div className="store-selection-header">
                <strong>Search Results ({filteredFood.length} items found)</strong>
              </div>
              {filteredFood.map(item => (
                <div 
                  className="customer-search-item" 
                  key={`${item.store}-${item.id}`}
                  onClick={() => handleDishSelect(item)}
                >
                  <img src={item.image} alt={item.name} />
                  <div className="search-item-details">
                    <span className="search-item-name">{item.name}</span>
                    <span className="search-item-store">📍 {item.store} Store</span>
                    <span className="search-item-price">₹{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show message when no results found */}
          {searchTerm && filteredFood.length === 0 && (
            <div className="customer-search-dropdown">
              <div className="no-results">
                No dishes found matching "{searchTerm}"
              </div>
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

      {/* Main Content */}
      <main className="customer-dashboard-content">
        
        {/* Dashboard Tabs */}
        <div className="customer-tabs">
          <button 
            className={`tab-button ${activeTab === "menu" ? "active" : ""}`}
            onClick={() => setActiveTab("menu")}
          >
            🍽️ Menu
          </button>
          <button 
            className={`tab-button ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            📊 My Impact
          </button>
        </div>

        {/* Wastage Reduction Stats Banner */}
        <div className="wastage-banner">
          🎉 You helped reduce <strong>{customerStats.wasteReduced} kg</strong> of food waste!
        </div>

        {activeTab === "menu" && selectedStore !== "Select a store" && (
          <div className="menu-section">
            {/* Store Header with Description */}
            <div className="store-header">
              <h2>🏪 {selectedStore} Store Menu</h2>
              <p className="store-description">{getStoreDescription(selectedStore)}</p>
              <p className="store-dish-count">{availableDishes.length} delicious dishes available</p>
            </div>
            
            {/* Dishes Grid */}
            <div className="dishes-grid">
              {availableDishes.map(dish => (
                <div key={dish.id} className="dish-card" onClick={() => {
                  setSelectedDish(dish);
                  getPortionRecommendation(dish.id);
                  checkDishStock(dish.id);
                }}>
                  <img src={dish.image} alt={dish.name} className="dish-image" />
                  <div className="dish-category">{dish.category}</div>
                  <h3>{dish.name}</h3>
                  <p className="dish-description">{dish.description}</p>
                  <p className="dish-price">₹{dish.price}</p>
                  <button className="view-details-btn">View Details & Order</button>
                </div>
              ))}
            </div>

            {/* Dish Details Modal */}
            {selectedDish && (
              <div className="dish-modal-overlay">
                <div className="dish-modal">
                  <button className="close-modal" onClick={() => setSelectedDish(null)}>×</button>
                  
                  <h2>{selectedDish.name}</h2>
                  <div className="dish-category-modal">{selectedDish.category}</div>
                  <img src={selectedDish.image} alt={selectedDish.name} className="modal-dish-image" />
                  <p className="dish-description-modal">{selectedDish.description}</p>
                  
                  {/* AI Recommendation */}
                  {portionRecommendation && (
                    <div className="recommendation-section">
                      <h3>🤖 AI Smart Recommendation</h3>
                      <p>{portionRecommendation}</p>
                    </div>
                  )}

                  {/* Stock Status */}
                  {stockStatus && (
                    <div className={`stock-section ${stockStatus.includes('Low Stock') ? 'low-stock' : 'in-stock'}`}>
                      {stockStatus}
                    </div>
                  )}

                  {/* Order Section */}
                  <div className="order-section">
                    <label>Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(parseInt(e.target.value))}
                      className="quantity-input"
                    />
                    <button 
                      onClick={() => submitOrder(selectedDish.id, orderQuantity)}
                      className="order-btn"
                    >
                      Place Order - ₹{(selectedDish.price * orderQuantity * 0.85).toFixed(2)}
                    </button>
                  </div>

                  {/* Feedback Section */}
                  <div className="feedback-section">
                    <h4>Help us reduce waste:</h4>
                    <select 
                      value={feedback.rating}
                      onChange={(e) => setFeedback({...feedback, rating: parseInt(e.target.value)})}
                      className="feedback-select"
                    >
                      <option value="5">Perfect Portion 👍</option>
                      <option value="3">Too Much 😕</option>
                      <option value="1">Way Too Much 🗑️</option>
                    </select>
                    <textarea
                      placeholder="Any comments on portion size?"
                      value={feedback.comment}
                      onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                      className="feedback-textarea"
                    />
                    <button 
                      onClick={() => submitFeedback(selectedDish.id, feedback.rating, feedback.comment)}
                      className="feedback-btn"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "menu" && selectedStore === "Select a store" && (
          <div className="select-store-prompt">
            <h2>🏪 Please Select Your Store</h2>
            <p>Choose from our locations to explore unique regional cuisines:</p>
            <div className="store-options">
              <div className="store-option">
                <h3>🔥 Guntur</h3>
                <p>Authentic Andhra spicy cuisine</p>
              </div>
              <div className="store-option">
                <h3>🌊 Vijayawada</h3>
                <p>Coastal seafood & vegetarian specialties</p>
              </div>
              <div className="store-option">
                <h3>👑 Hyderabad</h3>
                <p>Royal biryanis & Mughlai dishes</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="stats-section">
            <h2>Your Food Waste Reduction Impact</h2>
            <div className="stats-cards">
              <div className="stat-card">
                <h3>Total Waste Reduced</h3>
                <p className="stat-number">{customerStats.wasteReduced} kg</p>
                <p>Equivalent to saving {Math.round(customerStats.wasteReduced * 1000)} meals!</p>
              </div>
              <div className="stat-card">
                <h3>Orders Placed</h3>
                <p className="stat-number">{customerStats.totalOrders}</p>
                <p>Smart orders with AI recommendations</p>
              </div>
              <div className="stat-card">
                <h3>Money Saved</h3>
                <p className="stat-number">₹{customerStats.moneySaved}</p>
                <p>Through portion optimization</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerDashboard;