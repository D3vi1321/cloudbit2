import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the singleton instance directly
  const authServiceInstance = authService;

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authServiceInstance.getUser();
        const token = authServiceInstance.getToken();

        if (storedUser && token) {
          // Verify token with backend
          const isValid = await authServiceInstance.verifyToken();
          if (isValid) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear auth data
            authServiceInstance.clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authServiceInstance.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authServiceInstance]);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const data = await authServiceInstance.login(credentials);
      setUser(data);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setIsLoading(true);
      const data = await authServiceInstance.signup(userData);
      setUser(data);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authServiceInstance.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    authServiceInstance.setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    authService
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
