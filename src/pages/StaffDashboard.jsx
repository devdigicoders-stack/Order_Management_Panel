import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart, FileEdit, Clock, CheckCircle, Package, Truck, Bell, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';

export const StaffDashboard = () => {
  const user = useStore(state => state.user);
  const [orders, setOrders] = useState([]);
  const [pendingData, setPendingData] = useState({ pendingItems: [], totalPendingQty: 0 });
  const [receivedData, setReceivedData] = useState({ receivedItems: [], totalReceivedQty: 0 });
  const [notifsData, setNotifsData] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userOrders, pending, received, notifs] = await Promise.all([
        api.request('/orders'),
        api.getPendingItems(),
        api.getReceivedItems(),
        api.getNotifications()
      ]);

      setOrders(userOrders || []);
      setPendingData(pending || { pendingItems: [], totalPendingQty: 0 });
      setReceivedData(received || { receivedItems: [], totalReceivedQty: 0 });
      setNotifsData(notifs || { notifications: [], unreadCount: 0 });
    } catch (err) {
      console.warn('Staff dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalItemsOrdered = orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
  const pendingItems = pendingData.totalPendingQty || 0;
  const totalReceived = receivedData.totalReceivedQty || 0;
  const unreadNotifs = notifsData.unreadCount || 0;

  const draftOrders = orders.filter(o => o.status === 'draft').length;
  const submittedOrders = orders.filter(o => o.status === 'submitted').length;
  const approvedOrders = orders.filter(o => o.status === 'approved' || o.status === 'ordered').length;

  const pieData = [
    { name: 'Received', value: totalReceived },
    { name: 'Pending', value: pendingItems }
  ];
  const PIE_COLORS = ['#10b981', '#f59e0b'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <h1 className="text-xl font-bold text-white">Welcome, {user?.name || 'Salesperson'}</h1>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">Overview of your orders, pending items, and shipment status.</p>
        </div>
        <button onClick={loadData} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-500">Total Items Ordered</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{totalItemsOrdered}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-500">Still Pending</p>
          </div>
          <p className="text-xl font-bold text-amber-600">{pendingItems}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <Truck className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-500">Received Items</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{totalReceived}</p>
        </div>

        <Link to="/notifications" className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors block">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 relative">
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </div>
            <p className="text-xs font-semibold text-gray-500">Notifications</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{unreadNotifs} Unread</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Draft Orders</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{draftOrders}</p>
          </div>
          <FileEdit className="w-6 h-6 text-gray-400" />
        </div>
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-indigo-700 uppercase">Submitted Orders</p>
            <p className="text-xl font-bold text-indigo-900 mt-0.5">{submittedOrders}</p>
          </div>
          <Package className="w-6 h-6 text-indigo-500" />
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase">Approved Orders</p>
            <p className="text-xl font-bold text-emerald-900 mt-0.5">{approvedOrders}</p>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
      </div>

      {/* Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-2">Order Fulfillment Status</h2>
          <p className="text-xs text-gray-500 mb-6">Ratio of received vs outstanding pending items.</p>
          <div className="flex-1 min-h-[220px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-gray-900">{totalItemsOrdered}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Total Pcs</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Quick Actions</h2>
            <p className="text-xs text-gray-500 mb-4">Direct shortcuts to place orders or request products.</p>
          </div>

          <div className="space-y-3">
            <Link 
              to="/orders"
              className="flex items-center justify-between p-3.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-indigo-800 font-semibold text-xs"
            >
              <span>Go to Excel Order Entry Grid</span>
              <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold">Open</span>
            </Link>
            <Link 
              to="/staff/request-product"
              className="flex items-center justify-between p-3.5 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-amber-900 font-semibold text-xs"
            >
              <span>Request New Product (Pending Approval)</span>
              <span className="bg-amber-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold">Request</span>
            </Link>
            <Link 
              to="/staff/pending"
              className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-800 font-semibold text-xs"
            >
              <span>View Outstanding Pending Items</span>
              <span className="bg-gray-800 text-white px-2.5 py-1 rounded-md text-[10px] font-bold">View</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
