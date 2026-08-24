const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    try {
      const stored = localStorage.getItem('oms_token');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('oms_token', JSON.stringify(token));
    } else {
      localStorage.removeItem('oms_token');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          this.setToken(null);
          localStorage.removeItem('oms-storage-v4');
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.warn(`API call failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Auth Endpoints
  login(email, password, role) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  getProfile() {
    return this.request('/auth/me');
  }

  updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  changePassword(newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  // Products Endpoints
  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  getCompanies() {
    return this.request('/products/companies');
  }

  getPendingProducts() {
    return this.request('/products/pending');
  }

  getFavorites() {
    return this.request('/products/favorites');
  }

  toggleFavorite(productId) {
    return this.request(`/products/${productId}/favorite`, {
      method: 'POST'
    });
  }

  createProduct(product) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  requestNewProduct(product) {
    return this.request('/products/request', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  approveProduct(id, data) {
    return this.request(`/products/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateProduct(id, product) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  rejectProduct(id, reason) {
    return this.request(`/products/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Orders Endpoints
  getOrders() {
    return this.request('/orders');
  }

  getOrderMatrix(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders/matrix${query ? `?${query}` : ''}`);
  }

  getCompanyView(company) {
    return this.request(`/orders/company-view?company=${encodeURIComponent(company)}`);
  }

  getStaffView(staffId) {
    return this.request(`/orders/staff-view/${staffId}`);
  }

  updateCellQuantity(productId, staffId, quantity) {
    return this.request('/orders/cell-update', {
      method: 'POST',
      body: JSON.stringify({ productId, staffId, quantity }),
    });
  }

  submitOrders() {
    return this.request('/orders/submit', {
      method: 'POST',
    });
  }

  updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  markOrderSent(orderId) {
    return this.request(`/orders/${orderId}/mark-sent`, {
      method: 'POST'
    });
  }

  combineOrders(orderId, targetOrderId) {
    return this.request(`/orders/${orderId}/combine`, {
      method: 'POST',
      body: JSON.stringify({ targetOrderId })
    });
  }

  // Containers Endpoints
  getContainers() {
    return this.request('/containers');
  }

  createContainer(containerData) {
    return this.request('/containers', {
      method: 'POST',
      body: JSON.stringify(containerData),
    });
  }

  assignProductsToContainer(containerId, assignments) {
    return this.request(`/containers/${containerId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
  }

  updateContainerStatus(containerId, data) {
    return this.request(`/containers/${containerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Distribution Endpoints
  getDistributionMatrix(containerId) {
    return this.request(`/distribution/matrix/${containerId}`);
  }

  updateDistribution(containerId, productId, staffId, quantity) {
    return this.request('/distribution/update', {
      method: 'POST',
      body: JSON.stringify({ containerId, productId, staffId, quantity }),
    });
  }

  getPendingItems(staffId) {
    return this.request(`/distribution/pending${staffId ? `?staffId=${staffId}` : ''}`);
  }

  getReceivedItems(staffId) {
    return this.request(`/distribution/received${staffId ? `?staffId=${staffId}` : ''}`);
  }

  getProductContainerHistory(productId) {
    return this.request(`/distribution/product-history/${productId}`);
  }

  // Audit Logs Endpoints
  getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit${query ? `?${query}` : ''}`);
  }

  // Staff Management Endpoints
  getStaffList() {
    return this.request('/staff');
  }

  createStaff(staffData) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  // Export Endpoints
  getPurchaseOrderExport(company) {
    return this.request(`/export/purchase-order/${encodeURIComponent(company)}`);
  }

  // Notifications Endpoints
  getNotifications() {
    return this.request('/notifications');
  }

  markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
export default api;
