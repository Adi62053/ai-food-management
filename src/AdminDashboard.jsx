import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "profile", or "orders"
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    profilePhoto: "",
    bio: ""
  });
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load username and profile data from localStorage on component mount
  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) {
      setUsername(user);
      // Load saved profile data if exists
      const savedProfile = localStorage.getItem(`adminProfile_${user}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      } else {
        // Initialize with default values including username
        setProfileData(prev => ({
          ...prev,
          fullName: user,
          email: `${user}@admin.com`
        }));
      }
    } else {
      navigate("/");
    }
  }, [navigate, username]);

  // Load orders from backend
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/orders');
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      } else {
        console.error("Failed to fetch orders");
        // For demo purposes, create mock data
        setOrders(generateMockOrders());
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      // For demo purposes, create mock data
      setOrders(generateMockOrders());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock orders for demo
  const generateMockOrders = () => {
    const stores = ["Guntur", "Vijayawada", "Hyderabad"];
    const dishTypes = ["Veg", "Non-Veg"];
    const statuses = ["completed", "pending", "cancelled"];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      customerId: Math.floor(Math.random() * 1000) + 1,
      storeName: stores[Math.floor(Math.random() * stores.length)],
      totalAmount: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
      orderStatus: statuses[Math.floor(Math.random() * statuses.length)],
      orderDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      orderTime: new Date().toTimeString().split(' ')[0],
      orderItems: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
        dishId: j + 1,
        dishName: `Dish ${j + 1}`,
        dishType: dishTypes[Math.floor(Math.random() * dishTypes.length)],
        dishCategory: ["Main Course", "Snacks", "Dessert"][Math.floor(Math.random() * 3)],
        quantity: Math.floor(Math.random() * 3) + 1,
        unitPrice: parseFloat((Math.random() * 200 + 50).toFixed(2)),
        totalPrice: parseFloat((Math.random() * 600 + 100).toFixed(2))
      }))
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    alert("Logged out successfully!");
    navigate("/");
  };

  const handleProfileClick = () => {
    setActiveTab("profile");
    setShowDropdown(false);
  };

  const handleDashboardClick = () => {
    setActiveTab("dashboard");
  };

  const handleOrdersClick = () => {
    setActiveTab("orders");
    setShowDropdown(false);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const updatedProfile = {
          ...profileData,
          profilePhoto: event.target.result
        };
        setProfileData(updatedProfile);
        localStorage.setItem(`adminProfile_${username}`, JSON.stringify(updatedProfile));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    localStorage.setItem(`adminProfile_${username}`, JSON.stringify(profileData));
    alert("Profile saved successfully!");
    setActiveTab("dashboard");
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.admin-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Group orders by store
  const ordersByStore = orders.reduce((acc, order) => {
    if (!acc[order.storeName]) {
      acc[order.storeName] = [];
    }
    acc[order.storeName].push(order);
    return acc;
  }, {});

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-navbar">
        <img src="/ai-food-management/logo1.png" className="admin-dashboard-logo" alt="Logo" />
        
        {/* Navigation Buttons */}
        <div className="admin-nav-buttons">
          <button 
            className={`admin-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={handleDashboardClick}
          >
            📊 Dashboard
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={handleOrdersClick}
          >
            📦 Orders ({orders.length})
          </button>
        </div>

        {/* Username with Dropdown */}
        <div className="admin-dropdown">
          <div className="admin-username-container" onClick={toggleDropdown}>
            {profileData.profilePhoto ? (
              <img 
                src={profileData.profilePhoto} 
                alt="Profile" 
                className="admin-profile-pic"
              />
            ) : (
              <div className="admin-profile-pic-placeholder">👤</div>
            )}
            <span className="admin-username">{username}</span>
            <span className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>▼</span>
          </div>

          {showDropdown && (
            <div className="admin-dropdown-menu">
              <div className="dropdown-item" onClick={handleProfileClick}>
                👤 Profile
              </div>
              <div className="dropdown-item logout" onClick={handleLogout}>
                🚪 Logout
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="admin-dashboard-main">
        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <div className="admin-dashboard-content">
            <h1>Welcome to Admin Portal</h1>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Total Orders</h3>
                <p className="stat-number">{orders.length}</p>
              </div>
              <div className="stat-card">
                <h3>Stores</h3>
                <p className="stat-number">{Object.keys(ordersByStore).length}</p>
              </div>
              <div className="stat-card">
                <h3>Revenue</h3>
                <p className="stat-number">₹{orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders Content */}
        {activeTab === "orders" && (
          <div className="admin-orders-content">
            <div className="orders-header">
              <h1>📦 All Customer Orders</h1>
              <p>Total {orders.length} orders placed across all stores</p>
              <button className="refresh-orders-btn" onClick={fetchOrders}>
                🔄 Refresh Orders
              </button>
            </div>

            {loading ? (
              <div className="loading-orders">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : (
              <div className="orders-container">
                {Object.entries(ordersByStore).map(([storeName, storeOrders]) => (
                  <div key={storeName} className="store-orders-section">
                    <h2 className="store-name-header">
                      🏪 {storeName} Store 
                      <span className="order-count-badge">{storeOrders.length} orders</span>
                    </h2>
                    
                    <div className="store-orders-grid">
                      {storeOrders.map(order => (
                        <div key={order.id} className="order-card" onClick={() => viewOrderDetails(order)}>
                          <div className="order-card-header">
                            <span className="order-id">Order #{order.id}</span>
                            <span className={`order-status ${order.orderStatus}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          
                          <div className="order-card-body">
                            <div className="order-info">
                              <span className="customer-id">Customer ID: {order.customerId}</span>
                              <span className="order-date">{order.orderDate} at {order.orderTime}</span>
                            </div>
                            
                            <div className="order-items-preview">
                              {order.orderItems.map((item, index) => (
                                <div key={index} className="order-item-preview">
                                  <span className={`dish-type ${item.dishType.toLowerCase().replace('-', '')}`}>
                                    {item.dishType === "Veg" ? "🥗" : "🍗"}
                                  </span>
                                  <span className="dish-name">{item.dishName}</span>
                                  <span className="item-quantity">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="order-total">
                              Total: ₹{order.totalAmount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
              <div className="order-modal-overlay" onClick={closeOrderDetails}>
                <div className="order-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="close-modal" onClick={closeOrderDetails}>×</button>
                  
                  <h2>Order Details - #{selectedOrder.id}</h2>
                  
                  <div className="order-details-grid">
                    <div className="order-detail-section">
                      <h3>📋 Order Information</h3>
                      <div className="detail-row">
                        <span>Store:</span>
                        <span className="store-name">🏪 {selectedOrder.storeName}</span>
                      </div>
                      <div className="detail-row">
                        <span>Customer ID:</span>
                        <span>{selectedOrder.customerId}</span>
                      </div>
                      <div className="detail-row">
                        <span>Order Date:</span>
                        <span>{selectedOrder.orderDate}</span>
                      </div>
                      <div className="detail-row">
                        <span>Order Time:</span>
                        <span>{selectedOrder.orderTime}</span>
                      </div>
                      <div className="detail-row">
                        <span>Status:</span>
                        <span className={`status-badge ${selectedOrder.orderStatus}`}>
                          {selectedOrder.orderStatus}
                        </span>
                      </div>
                      <div className="detail-row total-amount">
                        <span>Total Amount:</span>
                        <span className="amount">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="order-items-section">
                      <h3>🍽️ Order Items</h3>
                      {selectedOrder.orderItems.map((item, index) => (
                        <div key={index} className="order-item-detail">
                          <div className="item-header">
                            <span className={`item-type ${item.dishType.toLowerCase().replace('-', '')}`}>
                              {item.dishType === "Veg" ? "🥗 Veg" : "🍗 Non-Veg"}
                            </span>
                            <span className="item-category">{item.dishCategory}</span>
                          </div>
                          <div className="item-name">{item.dishName}</div>
                          <div className="item-details">
                            <span>Quantity: {item.quantity}</span>
                            <span>Unit Price: ₹{item.unitPrice.toFixed(2)}</span>
                            <span className="item-total">Total: ₹{item.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Content */}
        {activeTab === "profile" && (
          <div className="admin-profile-content">
            <div className="profile-container">
              {/* Profile Photo Section */}
              <div className="profile-photo-section">
                <div className="photo-container">
                  {profileData.profilePhoto ? (
                    <img 
                      src={profileData.profilePhoto} 
                      alt="Profile" 
                      className="profile-photo"
                    />
                  ) : (
                    <div className="profile-photo-placeholder">
                      👤
                    </div>
                  )}
                </div>
                <div className="photo-upload">
                  <input
                    type="file"
                    id="profilePhoto"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="photo-input"
                  />
                  <label htmlFor="profilePhoto" className="upload-btn">
                    📷 Upload Photo
                  </label>
                  <p className="upload-hint">JPG, PNG or GIF - Max 5MB</p>
                </div>
              </div>

              {/* Profile Form Section */}
              <div className="profile-form-section">
                <div className="profile-form">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={username}
                      disabled
                      className="disabled-input"
                    />
                    <small>Username cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleProfileChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      placeholder="Enter your address"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      placeholder="Tell us about yourself..."
                      rows="4"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      className="save-profile-btn"
                      onClick={saveProfile}
                    >
                      💾 Save Profile
                    </button>
                    <button 
                      className="back-to-dashboard-btn"
                      onClick={handleDashboardClick}
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;