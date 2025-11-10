import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../CSS/Auth.css";
import courseVideo from "../assets/images/course-video.mp4";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ 
    show: false, 
    message: location.state?.message || '', 
    type: 'info' 
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const validateEmail = (email) => {
    // Check if email contains "@" and "." with "." coming after "@"
    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');
    return atIndex > 0 && dotIndex > atIndex && dotIndex < email.length - 1;
  };

  const validatePassword = (password) => {
    // Password must be at least 8 characters long
    if (password.length < 8) return false;
    
    // Must have at least 1 uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // Must have at least 1 lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // Must have at least 1 number
    if (!/\d/.test(password)) return false;
    
    // Must have at least 1 special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    
    return true;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email must contain '@' and '.' with '.' coming after '@'";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    if (!touchedFields[name]) {
      setTouchedFields(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setErrors({}); // Clear previous errors

    // Basic form validation
    if (!formData.email || !formData.password) {
      setErrors({ form: 'Email and password are required' });
      return;
    }

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setErrors({ 
          confirmPassword: 'Passwords do not match',
          password: 'Passwords do not match'
        });
        showToast('Passwords do not match', 'error');
        return;
      }
    }

    try {
      let result;
      
      if (isLogin) {
        result = await login({
          email: formData.email.trim(),
          password: formData.password
        });
      } else {
        // For signup, include all required fields
        result = await signup({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
      }
      
      if (result && result.success) {
        // Show success toast
        const successMessage = isLogin ? 'Login successful!' : 'Account created successfully!';
        showToast(successMessage, 'success');
        
        // Get redirect URL from location state or query params
        const redirectTo = location.state?.returnUrl || searchParams.get('redirect') || '/dashboard';
        
        // Redirect after showing toast
        setTimeout(() => {
          navigate(redirectTo);
        }, 1500);
      } else {
        throw new Error('Authentication failed. Please try again.');
      }
      
    } catch (error) {
      console.error("Authentication error:", error);
      
      // Handle different types of errors
      const errorMessage = error.message || 'An error occurred. Please try again.';
      
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('user')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ password: errorMessage });
      } else if (errorMessage.toLowerCase().includes('match')) {
        setErrors({ confirmPassword: errorMessage });
      } else {
        // For other errors, show as a general form error
        setErrors({ form: errorMessage });
      }
      
      // Show error toast
      showToast(errorMessage, 'error');
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    setErrors({});
    setTouchedFields({});
    setShowPassword(false);
    setFormSubmitted(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 4000);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, searchParams]);
  
  // Add body class for auth page to ensure full screen
  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-background">
        <video 
          className="auth-background-video" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src={courseVideo} type="video/mp4" />
        </video>
        <div className="auth-gradient-overlay"></div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          className={`auth-toast auth-toast-${toast.type}`}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="auth-toast-content">
            <svg className="auth-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <span className="auth-toast-message">{toast.message}</span>
          </div>
        </motion.div>
      )}
      
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="auth-header">
          <h1 className="auth-title">
            {isLogin ? "Welcome to CloudBit" : "Get Started with CloudBit"}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? "Sign in to continue your learning journey with CloudBit" 
              : "Join our e-learning community and unlock a world of knowledge"
            }
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          {!isLogin && (
            <div className="auth-name-row">
              <div className="auth-input-group">
                <div className="auth-input-container">
                  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div className="relative w-full">
                    <input
                    type="text"
                    name="firstName"
                    placeholder={formSubmitted && !formData.firstName ? "Required*" : "First Name"}
                    data-touched={touchedFields.firstName || formSubmitted}
                    required={!isLogin}
                    data-required={!isLogin}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`auth-input ${errors.firstName ? 'auth-input-error' : ''}`}
                    disabled={authLoading}
                  />
                  </div>
                </div>
                {errors.firstName && (
                  <span className="auth-field-error">{errors.firstName}</span>
                )}
              </div>
              
              <div className="auth-input-group">
                <div className="auth-input-container">
                  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div className="relative w-full">
                    <input
                    type="text"
                    name="lastName"
                    placeholder={formSubmitted && !formData.lastName ? "Required*" : "Last Name"}
                    data-touched={touchedFields.lastName || formSubmitted}
                    required={!isLogin}
                    data-required={!isLogin}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`auth-input ${errors.lastName ? 'auth-input-error' : ''}`}
                    disabled={authLoading}
                  />
                  </div>
                </div>
                {errors.lastName && (
                  <span className="auth-field-error">{errors.lastName}</span>
                )}
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <div className="auth-input-container">
              <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                name="email"
                placeholder={formSubmitted && !formData.email ? "Required*" : "Email Address"}
                data-touched={touchedFields.email || formSubmitted}
                required
                data-required
                value={formData.email}
                onChange={handleInputChange}
                className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                disabled={authLoading}
              />
            </div>
            {errors.email && (
              <span className="auth-field-error">{errors.email}</span>
            )}
          </div>

          <div className="auth-input-group">
            <div className="auth-input-container">
              <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={formSubmitted && !formData.password ? "Required*" : "Password"}
                data-touched={touchedFields.password || formSubmitted}
                required
                data-required
                value={formData.password}
                onChange={handleInputChange}
                className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
                disabled={authLoading}
              />
              <button 
                type="button" 
                className="auth-password-toggle"
                onClick={togglePasswordVisibility}
                disabled={authLoading}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span className="auth-field-error">{errors.password}</span>
            )}
          </div>

          {/* Confirm Password Field (only for signup) */}
          {!isLogin && (
            <div className="auth-input-group">
              <div className="auth-input-container">
                <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder={formSubmitted && !formData.confirmPassword ? "Required*" : "Confirm Password"}
                  data-touched={touchedFields.confirmPassword || formSubmitted}
                  required={!isLogin}
                  data-required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`auth-input ${errors.confirmPassword ? 'auth-input-error' : ''}`}
                  disabled={authLoading}
                />
              </div>
              {errors.confirmPassword && (
                <span className="auth-field-error">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          <motion.button
            type="submit"
            className="auth-submit-btn"
            whileHover={!authLoading ? { scale: 1.02 } : {}}
            whileTap={!authLoading ? { scale: 0.98 } : {}}
            disabled={authLoading}
          >
            {authLoading ? (
              <div className="auth-loading">
                <div className="auth-spinner"></div>
                {isLogin ? "Signing In..." : "Creating Account..."}
              </div>
            ) : (
              isLogin ? "Login" : "Sign Up"
            )}
          </motion.button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="auth-switch-btn"
              onClick={toggleAuthMode}
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
