// lib/api.js - Updated API Client with Connection Methods
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('API Client initialized with baseURL:', this.baseURL);
  }

  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${cleanEndpoint}`;
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage = typeof data === 'object' ? data.message || data.error : data;
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // System Status API methods
  async getSystemStatus() {
    return this.request('/system/status');
  }

  // Connection API methods
  async getConnections() {
    return this.request('/connections');
  }

  async getConnection(connectionId) {
    return this.request(`/connections/${connectionId}`);
  }

  async createConnection(connectionData) {
    return this.request('/connections', {
      method: 'POST',
      body: connectionData,
    });
  }

  async updateConnection(connectionId, connectionData) {
    return this.request(`/connections/${connectionId}`, {
      method: 'PUT',
      body: connectionData,
    });
  }

  async deleteConnection(connectionId) {
    return this.request(`/connections/${connectionId}`, {
      method: 'DELETE',
    });
  }

  async testConnection(connectionId) {
    return this.request(`/connections/${connectionId}/test`, {
      method: 'POST',
    });
  }

  async testConnectionConfig(connectionData) {
    return this.request('/connections/test-config', {
      method: 'POST',
      body: connectionData,
    });
  }

  // User API methods
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: userData,
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: userData,
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // PingOne Settings API methods
  async getPingOneSettings() {
    return this.request('/settings/pingone');
  }

  async savePingOneSettings(settings) {
    return this.request('/settings/pingone', {
      method: 'POST',
      body: settings,
    });
  }

  async testPingOneConnection(settings) {
    return this.request('/settings/pingone/test', {
      method: 'POST',
      body: settings,
    });
  }
}

export const apiClient = new ApiClient();
export { ApiClient };