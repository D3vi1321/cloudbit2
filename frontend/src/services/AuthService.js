const API_URL = 'http://localhost:5000/api/auth';

class AuthService {
  // Store token in localStorage
  setToken(token) {
    localStorage.setItem('authToken', token);
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Store user data in localStorage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get user data from localStorage
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Clear authentication data
  clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Verify token with backend
  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        this.setUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      this.clearAuthData();
      return false;
    }
  }

  // Login method
  async login(credentials) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      if (!data.token) {
        throw new Error('Authentication failed: No token received');
      }

      // Save token and user data
      this.setToken(data.token);
      this.setUser(data.user || data);

      return { 
        success: true, 
        user: data.user || data,
        token: data.token 
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Signup method
  async signup(userData) {
    try {
      // Basic validation
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      if (!data.token) {
        throw new Error('Registration failed: No token received');
      }

      // Auto-login after signup
      this.setToken(data.token);
      this.setUser(data.user || data);

      return { 
        success: true, 
        user: data.user || data,
        token: data.token 
      };
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }

  // Logout method
  async logout() {
    this.clearAuthData();
  }
}

export default new AuthService();