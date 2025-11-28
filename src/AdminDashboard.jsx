import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import PredictionModal from "./PredictionModal";

function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
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
  const [newOrders, setNewOrders] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showLivePopup, setShowLivePopup] = useState(false);
  const [liveOrders, setLiveOrders] = useState([]);
  const [customerNames, setCustomerNames] = useState({});
  
  // ADD THIS STATE FOR PREDICTION MODAL
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  
  const navigate = useNavigate();

  // Track processed order IDs to avoid duplicates
  const [processedOrderIds, setProcessedOrderIds] = useState(new Set());

  // Load username and profile data from localStorage on component mount
  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) {
      setUsername(user);
      const savedProfile = localStorage.getItem(`adminProfile_${user}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      } else {
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

  // Fetch customer names when orders change
  useEffect(() => {
    if (orders.length > 0) {
      fetchCustomerNames();
    }
  }, [orders]);

  // Auto-move live orders to main orders after 30 seconds
  useEffect(() => {
    const moveToMainOrders = () => {
      if (liveOrders.length > 0) {
        const now = Date.now();
        const ordersToMove = liveOrders.filter(order => 
          now - order.liveTimestamp > 30000 // 30 seconds
        );

        if (ordersToMove.length > 0) {
          console.log('Moving orders to main list:', ordersToMove.map(o => o.id));
          
          // Add to main orders
          setOrders(prev => {
            const newOrdersList = [...ordersToMove, ...prev];
            // Remove live specific properties
            return newOrdersList.map(order => {
              const { liveTimestamp, isLive, ...cleanOrder } = order;
              return cleanOrder;
            });
          });
          
          // Remove from live orders
          setLiveOrders(prev => 
            prev.filter(order => !ordersToMove.some(moveOrder => moveOrder.id === order.id))
          );
          
          // Update processed orders
          setProcessedOrderIds(prev => {
            const newSet = new Set(prev);
            ordersToMove.forEach(order => newSet.add(order.id));
            return newSet;
          });
        }
      }
    };

    const interval = setInterval(moveToMainOrders, 1000); // Check every second
    return () => clearInterval(interval);
  }, [liveOrders]);

  const fetchCustomerName = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${customerId}`);
      if (response.ok) {
        const customerData = await response.json();
        return customerData.name || customerData.fullName || customerData.username || `Customer ${customerId}`;
      }
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
    }
    return `Customer ${customerId}`;
  };

  const fetchCustomerNames = async () => {
    const uniqueCustomerIds = [...new Set(orders.map(order => order.customerId))];
    const namesMap = {};
    
    const promises = uniqueCustomerIds.map(async (customerId) => {
      const name = await fetchCustomerName(customerId);
      namesMap[customerId] = name;
    });
    
    await Promise.all(promises);
    setCustomerNames(namesMap);
  };

  const fetchCustomerNameForOrder = async (customerId) => {
    if (!customerNames[customerId]) {
      const name = await fetchCustomerName(customerId);
      setCustomerNames(prev => ({
        ...prev,
        [customerId]: name
      }));
    }
  };

  // Auto-refresh main orders every 30 seconds only when in orders tab
  useEffect(() => {
    if (activeTab === "orders") {
      fetchMainOrders();
      
      const interval = setInterval(() => {
        fetchMainOrders();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedOrder && !customerNames[selectedOrder.customerId]) {
      fetchCustomerNameForOrder(selectedOrder.customerId);
    }
  }, [selectedOrder, customerNames]);

  // Real-time order checking for live view - more frequent
  useEffect(() => {
    if (activeTab === "orders" && showLivePopup) {
      checkForNewOrders(); // Check immediately when opening
      const liveInterval = setInterval(() => {
        checkForNewOrders();
      }, 3000); // Check every 3 seconds for new orders

      return () => clearInterval(liveInterval);
    }
  }, [activeTab, showLivePopup, processedOrderIds]);

  // FIXED: Updated URL to /api/orders with data validation
  const fetchMainOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/orders'); // ✅ Fixed URL
      
      if (response.ok) {
        const ordersData = await response.json();
        console.log('📦 Raw orders data:', ordersData); // Debug log
        
        // Validate and clean orders data
        const validatedOrders = ordersData.map(order => ({
          id: order.id || `unknown-${Date.now()}-${Math.random()}`,
          customerId: order.customerId || 'unknown',
          storeName: order.storeName || 'Unknown Store',
          totalAmount: order.totalAmount || 0,
          orderStatus: order.orderStatus || 'PENDING',
          orderDate: order.orderDate || new Date().toLocaleDateString(),
          orderTime: order.orderTime || new Date().toLocaleTimeString(),
          customerPhone: order.customerPhone || '',
          orderItems: order.orderItems || []
        }));
        
        // Filter out orders that are currently in live orders
        const liveOrderIds = new Set(liveOrders.map(order => order.id));
        const mainOrders = validatedOrders.filter(order => !liveOrderIds.has(order.id));
        
        console.log('✅ Processed orders:', mainOrders); // Debug log
        setOrders(mainOrders);
      } else {
        console.error("❌ Failed to fetch orders - HTTP Status:", response.status);
        setOrders([]);
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Updated URL to /api/orders
  const checkForNewOrders = async () => {
    try {
      console.log('🔍 Checking for new orders...');
      const response = await fetch('http://localhost:8080/api/orders'); // ✅ Fixed URL
      
      if (response.ok) {
        const allOrders = await response.json();
        console.log('📦 All orders from API:', allOrders); // Debug log
        
        // Find orders that are not in processed orders or current live orders
        const newOrdersFound = allOrders.filter(order => 
          !processedOrderIds.has(order.id) && 
          !liveOrders.some(liveOrder => liveOrder.id === order.id)
        );
        
        if (newOrdersFound.length > 0) {
          console.log('🎯 Found new orders for live view:', newOrdersFound.map(o => o.id));
          
          const ordersWithTimestamp = newOrdersFound.map(order => ({
            ...order,
            liveTimestamp: Date.now(),
            isLive: true
          }));
          
          setLiveOrders(prev => {
            const updated = [...ordersWithTimestamp, ...prev].slice(0, 15);
            return updated;
          });
          
          // Show notifications for new orders
          newOrdersFound.forEach(order => {
            showOrderNotification(order);
          });
          
          setUnreadNotifications(prev => prev + newOrdersFound.length);
          
          // Mark as processed to avoid duplicates
          setProcessedOrderIds(prev => {
            const newSet = new Set(prev);
            newOrdersFound.forEach(order => newSet.add(order.id));
            return newSet;
          });
        }
      } else {
        console.error('❌ Failed to check new orders - HTTP Status:', response.status);
      }
    } catch (error) {
      console.error("❌ Error checking for new orders:", error);
    }
  };

  const getCustomerName = (customerId) => {
    return customerNames[customerId] || `Customer ${customerId}`;
  };

  const showOrderNotification = (order) => {
    const customerName = getCustomerName(order.customerId);
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`🆕 Live Order #${order.id}`, {
        body: `From ${customerName} - ₹${order.totalAmount}`,
        icon: "/ai-food-management/logo1.png"
      });
    }
    
    const notification = document.createElement('div');
    notification.className = 'in-app-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <strong>🆕 Live Order #${order.id}</strong>
        <p>${customerName} • ${order.storeName || 'Store'}</p>
        <p>₹${order.totalAmount?.toFixed(2) || '0.00'} • ${new Date().toLocaleTimeString()}</p>
        <small>Will appear in main orders in 30 seconds</small>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const getTimeRemaining = (liveTimestamp) => {
    const now = Date.now();
    const elapsed = now - liveTimestamp;
    const remaining = 30000 - elapsed; // 30 seconds total
    return Math.max(0, Math.floor(remaining / 1000)); // Return seconds remaining
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
    setShowLivePopup(false);
  };

  const handleOrdersClick = () => {
    setActiveTab("orders");
    setShowDropdown(false);
    setUnreadNotifications(0);
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

  const toggleLivePopup = () => {
    setShowLivePopup(!showLivePopup);
    setUnreadNotifications(0);
    if (!showLivePopup) {
      // When opening live view, check for new orders immediately
      checkForNewOrders();
    }
  };

  const clearLiveOrders = () => {
    setLiveOrders([]);
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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

  // Group orders by store - FIXED: Added null check
  const ordersByStore = orders.reduce((acc, order) => {
    const storeName = order.storeName || 'Unknown Store';
    if (!acc[storeName]) {
      acc[storeName] = [];
    }
    acc[storeName].push(order);
    return acc;
  }, {});

  return (
    <div className="admin-dashboard-container">
      {/* Navbar */}
      <div className="admin-dashboard-navbar">
        <img src="/ai-food-management/logo1.png" className="admin-dashboard-logo" alt="Logo" />
        
        <div className="admin-nav-buttons">
          {/* Navigation buttons removed from here since they're now in sidebar */}
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

      <div className="admin-layout">
        {/* Sidebar Menu */}
        <div className="admin-sidebar">
          <div className="sidebar-menu">
            <button 
              className={`sidebar-menu-btn ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={handleDashboardClick}
            >
              📊 Dashboard
            </button>
            <button 
              className={`sidebar-menu-btn ${activeTab === "orders" ? "active" : ""}`}
              onClick={handleOrdersClick}
            >
              📦 Orders 
              {unreadNotifications > 0 && (
                <span className="sidebar-notification-badge">{unreadNotifications}</span>
              )}
            </button>

            {/* UPDATED: Prediction button now opens modal instead of changing tab */}
            <button 
              className="sidebar-menu-btn prediction-btn"
              onClick={() => setShowPredictionModal(true)}
            >
              🔮 AI Predictions
            </button>

            <button 
              className={`sidebar-menu-btn ${activeTab === "inventory" ? "active" : ""}`}
              onClick={() => setActiveTab("inventory")}
            >
              📦 Inventory
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="admin-dashboard-main">
          {/* Dashboard Content */}
          {activeTab === "dashboard" && (
            <div className="admin-dashboard-content">
              <h1>Welcome to Admin Portal {username}</h1>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Total Orders</h3>
                  <p className="stat-number">{orders.length + liveOrders.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Stores</h3>
                  <p className="stat-number">{Object.keys(ordersByStore).length}</p>
                </div>
                <div className="stat-card">
                  <h3>Revenue</h3>
                  <p className="stat-number">₹{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Orders Content */}
          {activeTab === "orders" && (
            <div className="admin-orders-content">
              {/* Live Orders Popup - Only shown in orders tab */}
              {showLivePopup && (
                <div className="live-orders-popup">
                  <div className="popup-header">
                    <div className="live-indicator">
                      <div className="pulsating-dot"></div>
                      <span>📺 LIVE ORDERS</span>
                      <span className="live-count">{liveOrders.length} incoming</span>
                    </div>
                    <div className="popup-controls">
                      <button className="clear-live-btn" onClick={clearLiveOrders}>
                        🗑️ Clear
                      </button>
                      <button className="close-popup" onClick={toggleLivePopup}>×</button>
                    </div>
                  </div>
                  <div className="popup-content">
                    {liveOrders.length > 0 ? (
                      <div className="live-orders-stream">
                        {liveOrders.map((order, index) => {
                          const timeRemaining = getTimeRemaining(order.liveTimestamp);
                          return (
                            <div key={`live-${order.id}-${index}`} className="live-order-item">
                              <div className="live-order-badge">
                                🆕 LIVE
                                <div className="countdown-timer">{timeRemaining}s</div>
                              </div>
                              <div className="live-order-info">
                                <div className="customer-info">
                                  <strong>{getCustomerName(order.customerId)}</strong>
                                  {order.customerPhone && (
                                    <span className="customer-phone">{order.customerPhone}</span>
                                  )}
                                </div>
                                <div className="order-details">
                                  <span>Order #{order.id}</span>
                                  {order.storeName && (
                                    <span className="store-badge">🏪 {order.storeName}</span>
                                  )}
                                  <span className="amount">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                                {order.orderItems && order.orderItems.length > 0 && (
                                  <div className="order-items">
                                    {order.orderItems.map((item, idx) => (
                                      <span key={`live-item-${order.id}-${idx}`} className="order-item-tag">
                                        {item.dishName || `Item ${idx + 1}`} x{item.quantity}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="order-progress">
                                  <div 
                                    className="progress-bar" 
                                    style={{width: `${((30000 - (timeRemaining * 1000)) / 30000) * 100}%`}}
                                  ></div>
                                  <span className="progress-text">
                                    Moving to orders in {timeRemaining}s
                                  </span>
                                </div>
                              </div>
                              <div className="live-order-time">
                                {order.orderTime || new Date(order.liveTimestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-live-orders">
                        <div className="waiting-animation">⏳</div>
                        <p>Waiting for new customer orders...</p>
                        <small>New orders will appear here first for 30 seconds</small>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Auto-refresh Indicator - Only shown in orders tab */}
              <div className="auto-refresh-indicator">
                <div className="refresh-dot"></div>
                <span>Live orders show for 30 seconds before moving to main orders</span>
                <button className="toggle-live-popup-btn" onClick={toggleLivePopup}>
                  {showLivePopup ? "📺 Hide Live View" : "📺 Show Live View"}
                </button>
              </div>

              <div className="orders-header">
                <h1>📦 All Customer Orders</h1>
                <p>Total {orders.length} orders in main list • {liveOrders.length} in live view</p>
                <div className="refresh-info">
                  <button className="refresh-orders-btn" onClick={fetchMainOrders}>
                    🔄 Refresh Orders
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="loading-orders">
                  <div className="loading-spinner"></div>
                  <p>Loading orders...</p>
                </div>
              ) : (
                <div className="orders-container">
                  {orders.length > 0 ? (
                    Object.entries(ordersByStore).map(([storeName, storeOrders]) => (
                      <div key={`store-${storeName}`} className="store-orders-section">
                        <h2 className="store-name-header">
                          🏪 {storeName} Store 
                          <span className="order-count-badge">{storeOrders.length} orders</span>
                        </h2>
                        
                        <div className="store-orders-grid">
                          {storeOrders.map(order => (
                            <div 
                              key={`order-${order.id}`} 
                              className="order-card" 
                              onClick={() => viewOrderDetails(order)}
                            >
                              <div className="order-card-header">
                                <span className="order-id">Order #{order.id}</span>
                                <span className={`order-status ${order.orderStatus}`}>
                                  {order.orderStatus || 'PENDING'}
                                </span>
                              </div>
                              
                              <div className="order-card-body">
                                <div className="customer-info">
                                  <strong className="customer-name">
                                    {getCustomerName(order.customerId)}
                                  </strong>
                                  {order.customerPhone && (
                                    <span className="customer-phone">{order.customerPhone}</span>
                                  )}
                                </div>
                                
                                <div className="order-info">
                                  <span className="order-date">{order.orderDate} at {order.orderTime}</span>
                                </div>
                                
                                {order.orderItems && order.orderItems.length > 0 && (
                                  <div className="order-items-preview">
                                    {order.orderItems.map((item, index) => (
                                      <div key={`preview-${order.id}-${index}`} className="order-item-preview">
                                        <span className={`dish-type ${item.dishType?.toLowerCase().replace('-', '') || 'veg'}`}>
                                          {item.dishType === "Non-Veg" ? "🍗" : "🥗"}
                                        </span>
                                        <span className="dish-name">{item.dishName || `Item ${index + 1}`}</span>
                                        <span className="item-quantity">x{item.quantity || 1}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="order-total">
                                  Total: ₹{order.totalAmount?.toFixed(2) || '0.00'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-orders-message">
                      <h3>No orders in main list</h3>
                      <p>Orders will appear here 30 seconds after they are received in live view</p>
                    </div>
                  )}
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
                        <h3>👤 Customer Information</h3>
                        <div className="detail-row">
                          <span>Name:</span>
                          <span className={`customer-name customer-${selectedOrder.customerId}`}>
                            {getCustomerName(selectedOrder.customerId)}
                          </span>
                        </div>
                        {selectedOrder.customerPhone && (
                          <div className="detail-row">
                            <span>Phone:</span>
                            <span>{selectedOrder.customerPhone}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span>Customer ID:</span>
                          <span>{selectedOrder.customerId}</span>
                        </div>
                      </div>

                      <div className="order-detail-section">
                        <h3>📋 Order Information</h3>
                        {selectedOrder.storeName && (
                          <div className="detail-row">
                            <span>Store:</span>
                            <span className="store-name">🏪 {selectedOrder.storeName}</span>
                          </div>
                        )}
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
                            {selectedOrder.orderStatus || 'PENDING'}
                          </span>
                        </div>
                        <div className="detail-row total-amount">
                          <span>Total Amount:</span>
                          <span className="amount">₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                        <div className="order-items-section">
                          <h3>🍽️ Order Items</h3>
                          {selectedOrder.orderItems.map((item, index) => (
                            <div key={`item-${selectedOrder.id}-${index}`} className="order-item-detail">
                              <div className="item-header">
                                <span className={`item-type ${item.dishType?.toLowerCase().replace('-', '') || 'veg'}`}>
                                  {item.dishType === "Non-Veg" ? "🍗 Non-Veg" : "🥗 Veg"}
                                </span>
                                <span className="item-category">{item.dishCategory || 'General'}</span>
                              </div>
                              <div className="item-name">{item.dishName || `Item ${index + 1}`}</div>
                              <div className="item-details">
                                <span>Quantity: {item.quantity || 1}</span>
                                <span>Unit Price: ₹{item.unitPrice?.toFixed(2) || '0.00'}</span>
                                <span className="item-total">Total: ₹{item.totalPrice?.toFixed(2) || '0.00'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Content */}
          {activeTab === "profile" && (
            <div className="admin-profile-content">
              <h1>👤 Admin Profile</h1>
              <div className="profile-form">
                <div className="profile-photo-section">
                  <div className="profile-photo-container">
                    {profileData.profilePhoto ? (
                      <img src={profileData.profilePhoto} alt="Profile" className="profile-photo" />
                    ) : (
                      <div className="profile-photo-placeholder">👤</div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="photo-upload-input"
                    id="profile-photo-upload"
                  />
                  <label htmlFor="profile-photo-upload" className="photo-upload-btn">
                    📷 Upload Photo
                  </label>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
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
                  <button className="save-profile-btn" onClick={saveProfile}>
                    💾 Save Profile
                  </button>
                  <button 
                    className="cancel-btn" 
                    onClick={() => setActiveTab("dashboard")}
                  >
                    ↩️ Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Content */}
          {activeTab === "inventory" && (
            <div className="admin-inventory-content">
              <h1>📦 Inventory Management</h1>
              <p>Inventory features coming soon...</p>
            </div>
          )}
        </main>
      </div>

      {/* ADD PREDICTION MODAL HERE - Outside the main content flow */}
      {showPredictionModal && (
        <PredictionModal 
          isOpen={showPredictionModal}
          onClose={() => setShowPredictionModal(false)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;