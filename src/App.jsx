import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

import Services from "./Services";
import Contact from "./Contact";
import About from "./About";

import AdminDashboard from "./AdminDashboard";
import CustomerDashboard from "./CustomerDashboard";

function Layout({ children, showLogin = false }) {
  const [showRegisterOptions, setShowRegisterOptions] = useState(false);
  const [registerType, setRegisterType] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [formData, setFormData] = useState({
    regUsername: "",
    email: "",
    mobile: "",
    createPassword: "",
    confirmPassword: "",
    securityCode: "",
    address: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    setUsername("");
    setPassword("");
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "securityCode") setIsVerified(false);
  };

  const resetForm = () => {
    setFormData({
      regUsername: "",
      email: "",
      mobile: "",
      createPassword: "",
      confirmPassword: "",
      securityCode: "",
      address: "",
    });
    setVerificationStatus("");
    setIsVerified(false);
  };

  const handleRegisterClick = () => {
    setUsername("");
    setPassword("");
    setShowRegisterOptions(true);
    setRegisterType("");
    resetForm();
  };

  const closePopup = () => {
    setShowRegisterOptions(false);
    setRegisterType("");
    resetForm();
  };

  const handleRegisterType = (type) => setRegisterType(type);

  // ---------------- Admin / Customer Login ----------------
  const handleLogin = () => {
    if (!username || !password || (isAdminLogin && !securityCode)) {
      alert("Please fill all required fields");
      return;
    }

    const loginUrl = isAdminLogin
      ? "http://localhost:8080/api/admins/login"
      : "http://localhost:8080/api/customers/login";

    const loginData = isAdminLogin
      ? { username, password, securityCode }
      : { username, password };

    axios
      .post(loginUrl, loginData)
      .then((res) => {
        const data = res.data;
        if (data === "Admin login successful!" || data === "Login successful!") {
          localStorage.setItem("username", username);
          navigate(isAdminLogin ? "/admin" : "/customer");
          setUsername("");
          setPassword("");
          setSecurityCode("");
        } else {
          alert("Invalid credentials!");
        }
      })
      .catch((err) => {
        alert(err.response ? JSON.stringify(err.response.data) : "Login failed");
        console.error(err);
      });
  };

  const handleForgotCode = () => {
    alert("Redirecting to Security Code Recovery!");
  };

  // ---------------- Customer Registration ----------------
  const handleCustomerRegister = () => {
    if (formData.createPassword !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const data = {
      username: formData.regUsername,
      email: formData.email,
      mobile: formData.mobile,
      password: formData.createPassword,
    };

    axios
      .post("http://localhost:8080/api/customers/register", data)
      .then(() => {
        alert("Registration successful!");
        closePopup();
      })
      .catch((err) => {
        alert(err.response ? JSON.stringify(err.response.data) : "Registration failed");
        console.error(err);
      });
  };

  // ---------------- Admin Registration ----------------
  const handleAdminRegister = () => {
    const { regUsername, email, mobile, address, createPassword, confirmPassword, securityCode } = formData;

    if (!regUsername || !email || !address || !createPassword || !confirmPassword || !securityCode) {
      alert("Please fill all required fields and verify the security code before submitting.");
      return;
    }

    if (!isVerified) {
      alert("Security code is not verified. Please verify before registering.");
      return;
    }

    if (createPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const data = {
      username: regUsername,
      email: email,
      mobile: mobile,
      address: address,
      securityCode: securityCode,
      password: createPassword,
      confirmPassword: confirmPassword,
    };

    axios
      .post("http://localhost:8080/api/admins/register", data, {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        alert(res.data.message || "Admin registration successful!");
        closePopup();
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Registration failed.");
        console.error(err);
      });
  };

  const handleGenerateCode = () => {
    if (!formData.regUsername) {
      alert("Enter Username first!");
      return;
    }

    axios
      .post(`http://localhost:8080/api/admins/generate-code/${formData.regUsername}`)
      .then(() => {
        alert("Verification code sent to founder's email!");
        setVerificationStatus("Code Sent");
        setIsVerified(false);
      })
      .catch((err) => {
        alert("Code generation failed");
        console.error(err);
      });
  };

  const handleVerifyCode = () => {
    if (!formData.regUsername || !formData.securityCode) {
      alert("Enter Username & Code!");
      return;
    }

    axios
      .post("http://localhost:8080/api/admins/verify-code", {
        username: formData.regUsername,
        securityCode: formData.securityCode,
      })
      .then((res) => {
        if (res.data === "Code verified successfully!") {
          alert("Code verified successfully!");
          setVerificationStatus("Verified");
          setIsVerified(true);
        } else {
          alert("Invalid or expired code");
          setVerificationStatus("Not Verified");
          setIsVerified(false);
        }
      })
      .catch((err) => {
        alert("Verification failed");
        console.error(err);
      });
  };

  return (
    <div className="dashboard">
      {/* Top Navigation Bar */}
      <div className="navbar">
      <img src="/logo1.png" className="logo" alt="Logo" />


        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="right-section">
          <button className="nav-btn" onClick={handleRegisterClick}>
            Register
          </button>
        </div>
      </div>

      {/* Page Content */}
      <main className="dashboard-content">{children}</main>

      {/* Show Login only on Home */}
      {showLogin && (
        <div className="login-box">
          <h2>{isAdminLogin ? "Admin Login" : "Customer Login"}</h2>
          <input
            type="text"
            placeholder="Username"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
          />
          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {isAdminLogin && (
            <div className="security-code-container">
              <input
                type="text"
                placeholder="Security Code"
                className="login-input"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
              />
              <span className="forgot-code-link" onClick={handleForgotCode}>
                Forgot Code?
              </span>
            </div>
          )}
          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>
          <button className="toggle-login-btn" onClick={() => setIsAdminLogin(!isAdminLogin)}>
            {isAdminLogin ? "Switch to Customer Login" : "Switch to Admin Login"}
          </button>
        </div>
      )}

      {/* Registration Popups */}
      {showRegisterOptions && !registerType && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Register As:</h3>
            <button className="popup-btn1" onClick={() => handleRegisterType("customer")}>
              Customer
            </button>
            <button className="popup-btn1" onClick={() => handleRegisterType("admin")}>
              Admin
            </button>
            <button className="close-btn" onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Customer Registration */}
      {registerType === "customer" && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Customer Registration</h3>
            <input
              type="text"
              placeholder="Username"
              value={formData.regUsername}
              onChange={(e) => handleChange("regUsername", e.target.value)}
            />
            <input
              type="email"
              placeholder="Email ID"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            <input
              type="text"
              placeholder="Mobile No"
              value={formData.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
            />
            <input
              type="password"
              placeholder="Create Password"
              value={formData.createPassword}
              onChange={(e) => handleChange("createPassword", e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
            />
            <button className="popup-btn" onClick={handleCustomerRegister}>
              Submit
            </button>
            <button className="close-btn" onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Admin Registration */}
      {registerType === "admin" && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Admin Registration</h3>
            <input
              type="text"
              placeholder="Username"
              value={formData.regUsername}
              onChange={(e) => handleChange("regUsername", e.target.value)}
            />
            <input
              type="email"
              placeholder="Email ID"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            <input
              type="text"
              placeholder="Mobile No"
              value={formData.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
            />
            <input
              type="text"
              placeholder="Security Code"
              value={formData.securityCode}
              onChange={(e) => handleChange("securityCode", e.target.value)}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="popup-btn2" onClick={handleGenerateCode}>
                Generate Code
              </button>
              <button className="popup-btn2" onClick={handleVerifyCode}>
                Verify
              </button>
            </div>
            <p style={{ color: verificationStatus === "Verified" ? "green" : "red" }}>
              {verificationStatus}
            </p>
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
            <input
              type="password"
              placeholder="Create Password"
              value={formData.createPassword}
              onChange={(e) => handleChange("createPassword", e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
            />
            <button className="popup-btn" onClick={handleAdminRegister} disabled={!isVerified}>
              Submit
            </button>
            <button className="close-btn" onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Home() {
  return <h1>Welcome to AI Food Management Portal</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout showLogin={true}><Home /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/services" element={<Layout><Services /></Layout>} />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/customer" element={<CustomerDashboard />} />
    </Routes>
  );
}


export default App;
