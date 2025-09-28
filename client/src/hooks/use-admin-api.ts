
import { useAuth } from './use-auth';

export function useAdminApi() {
  const { logout } = useAuth();

  const request = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      logout();
      throw new Error('No authentication token found');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    };

    // Solo agregar Content-Type si no es FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      logout();
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const upload = async (url: string, formData: FormData) => {
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      logout();
      throw new Error('No authentication token found');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      logout();
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  return {
    get: (url: string) => request(url, { method: 'GET' }),
    post: (url: string, data?: any) => request(url, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    put: (url: string, data?: any) => request(url, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    delete: (url: string) => request(url, { method: 'DELETE' }),
    patch: (url: string, data?: any) => request(url, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    upload,
  };
}
