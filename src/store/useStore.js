import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      products: [],
      pendingProducts: [],
      companies: [],
      staff: [],
      orders: [],
      orderMatrix: [],
      containers: [],
      distributions: [],
      pendingItems: [],
      receivedItems: [],
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,

      // --- Authentication ---
      login: async (email, password, role) => {
        set({ loading: true, error: null });
        try {
          const res = await api.login(email, password, role);
          api.setToken(res.token);
          set({ user: res.user, token: res.token, loading: false, error: null });
          return res.user;
        } catch (err) {
          api.setToken(null);
          set({ user: null, token: null, loading: false, error: err.message });
          throw err;
        }
      },

      logout: () => {
        api.setToken(null);
        set({
          user: null,
          token: null,
          orderMatrix: [],
          pendingItems: [],
          receivedItems: []
        });
      },

      updateUserProfile: async (name, email, phone) => {
        try {
          const res = await api.updateProfile({ name, email, phone });
          if (res.user) {
            set((state) => ({ user: { ...state.user, ...res.user } }));
          }
        } catch (err) {
          set((state) => ({ user: state.user ? { ...state.user, name, email, phone } : null }));
        }
      },

      updateUserPassword: async (newPassword) => {
        try {
          await api.changePassword(newPassword);
        } catch (err) {
          console.warn('Password update error:', err.message);
        }
      },

      // --- Products ---
      fetchProducts: async (params = {}) => {
        try {
          const data = await api.getProducts(params);
          set({ products: data });
          return data;
        } catch (err) {
          console.warn('Fetch products failed:', err.message);
        }
      },

      fetchCompanies: async () => {
        try {
          const data = await api.getCompanies();
          set({ companies: data });
          return data;
        } catch (err) {
          console.warn('Fetch companies failed:', err.message);
        }
      },

      fetchPendingProducts: async () => {
        try {
          const data = await api.getPendingProducts();
          set({ pendingProducts: data });
          return data;
        } catch (err) {
          console.warn('Fetch pending products failed:', err.message);
        }
      },

      addProduct: async (productData) => {
        try {
          const res = await api.createProduct(productData);
          set((state) => ({ products: [res, ...state.products] }));
          return res;
        } catch (err) {
          console.error('Add product failed:', err.message);
          throw err;
        }
      },

      requestNewProduct: async (productData) => {
        try {
          const res = await api.requestNewProduct(productData);
          set((state) => ({ pendingProducts: [res, ...state.pendingProducts] }));
          return res;
        } catch (err) {
          console.error('Request product failed:', err.message);
          throw err;
        }
      },

      approveProduct: async (id, approvalData) => {
        try {
          const res = await api.approveProduct(id, approvalData);
          set((state) => ({
            pendingProducts: state.pendingProducts.filter((p) => p.id !== id && p._id !== id),
            products: res.product ? [res.product, ...state.products] : state.products
          }));
          return res;
        } catch (err) {
          console.error('Approve product failed:', err.message);
          throw err;
        }
      },

      rejectProduct: async (id, reason) => {
        try {
          await api.rejectProduct(id, reason);
          set((state) => ({
            pendingProducts: state.pendingProducts.filter((p) => p.id !== id && p._id !== id)
          }));
        } catch (err) {
          console.error('Reject product failed:', err.message);
          throw err;
        }
      },

      // --- Orders & Matrix ---
      fetchOrderMatrix: async (params = {}) => {
        try {
          const data = await api.getOrderMatrix(params);
          set({
            orderMatrix: data.matrix || [],
            staff: data.staff || get().staff
          });
          return data;
        } catch (err) {
          console.warn('Fetch order matrix failed:', err.message);
        }
      },

      updateOrderCell: async (productId, staffId, quantity) => {
        // Optimistic UI update on orderMatrix
        set((state) => {
          const updatedMatrix = (state.orderMatrix || []).map((row) => {
            if (row.id === productId || row._id === productId) {
              const oldQty = Number(row[staffId] || 0);
              const newQty = Number(quantity) || 0;
              const diff = newQty - oldQty;
              const newTotal = Math.max(0, (row.total || 0) + diff);
              return {
                ...row,
                [staffId]: newQty,
                total: newTotal,
                totalCuft: Number((newTotal * (row.cuft || 0)).toFixed(2))
              };
            }
            return row;
          });
          return { orderMatrix: updatedMatrix };
        });

        try {
          await api.updateCellQuantity(productId, staffId, quantity);
        } catch (err) {
          console.warn('Update order cell failed:', err.message);
        }
      },

      submitDraftOrders: async () => {
        try {
          const res = await api.submitOrders();
          return res;
        } catch (err) {
          console.error('Submit orders failed:', err.message);
          throw err;
        }
      },

      updateOrderStatus: async (orderId, status) => {
        try {
          const res = await api.updateOrderStatus(orderId, status);
          return res;
        } catch (err) {
          console.error('Update order status failed:', err.message);
          throw err;
        }
      },

      // --- Containers ---
      fetchContainers: async () => {
        try {
          const data = await api.getContainers();
          set({ containers: data });
          return data;
        } catch (err) {
          console.warn('Fetch containers failed:', err.message);
        }
      },

      addContainer: async (containerData) => {
        try {
          const res = await api.createContainer(containerData);
          set((state) => ({ containers: [res, ...state.containers] }));
          return res;
        } catch (err) {
          console.error('Create container failed:', err.message);
          throw err;
        }
      },

      assignToContainer: async (containerId, assignments) => {
        try {
          const res = await api.assignProductsToContainer(containerId, assignments);
          set((state) => ({
            containers: state.containers.map((c) => (c.id === containerId || c._id === containerId ? res.container : c))
          }));
          return res;
        } catch (err) {
          console.error('Assign to container failed:', err.message);
          throw err;
        }
      },

      updateContainerStatus: async (containerId, statusData) => {
        try {
          const res = await api.updateContainerStatus(containerId, statusData);
          set((state) => ({
            containers: state.containers.map((c) => (c.id === containerId || c._id === containerId ? res.container : c))
          }));
          return res;
        } catch (err) {
          console.error('Update container status failed:', err.message);
          throw err;
        }
      },

      // --- Distribution ---
      fetchDistributionMatrix: async (containerId) => {
        try {
          const data = await api.getDistributionMatrix(containerId);
          return data;
        } catch (err) {
          console.warn('Fetch distribution matrix failed:', err.message);
        }
      },

      updateDistributionCell: async (containerId, productId, staffId, quantity) => {
        try {
          await api.updateDistribution(containerId, productId, staffId, quantity);
        } catch (err) {
          console.warn('Update distribution failed:', err.message);
        }
      },

      fetchPendingItems: async (staffId) => {
        try {
          const data = await api.getPendingItems(staffId);
          set({ pendingItems: data.pendingItems || [] });
          return data;
        } catch (err) {
          console.warn('Fetch pending items failed:', err.message);
        }
      },

      fetchReceivedItems: async (staffId) => {
        try {
          const data = await api.getReceivedItems(staffId);
          set({ receivedItems: data.receivedItems || [] });
          return data;
        } catch (err) {
          console.warn('Fetch received items failed:', err.message);
        }
      },

      // --- Staff Management ---
      fetchStaff: async () => {
        try {
          const data = await api.getStaffList();
          set({ staff: data });
          return data;
        } catch (err) {
          console.warn('Fetch staff failed:', err.message);
        }
      },

      addStaff: async (staffData) => {
        try {
          const res = await api.createStaff(staffData);
          set((state) => ({ staff: [...state.staff, res] }));
          return res;
        } catch (err) {
          console.error('Add staff failed:', err.message);
          throw err;
        }
      },

      // --- Notifications ---
      fetchNotifications: async () => {
        try {
          const data = await api.getNotifications();
          set({
            notifications: data.notifications || [],
            unreadCount: data.unreadCount || 0
          });
          return data;
        } catch (err) {
          console.warn('Fetch notifications failed:', err.message);
        }
      },

      markNotificationRead: async (id) => {
        try {
          await api.markNotificationAsRead(id);
          set((state) => ({
            notifications: state.notifications.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n)),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }));
        } catch (err) {
          console.warn('Mark notification read failed:', err.message);
        }
      },

      markAllNotificationsRead: async () => {
        try {
          await api.markAllNotificationsAsRead();
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0
          }));
        } catch (err) {
          console.warn('Mark all notifications read failed:', err.message);
        }
      }
    }),
    {
      name: 'oms-storage-v4',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);
export default useStore;
