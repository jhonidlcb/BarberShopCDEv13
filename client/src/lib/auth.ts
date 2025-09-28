
interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: AdminUser;
}

class AuthService {
  private token: string | null = null;
  private user: AdminUser | null = null;

  constructor() {
    this.token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
      }
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    
    return data;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.token = null;
    this.user = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  async checkAuth(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch('/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const userData = await response.json();
      this.user = userData;
      localStorage.setItem('admin_user', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      this.logout();
      return false;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AdminUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }
    
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }
}

export const authService = new AuthService();
