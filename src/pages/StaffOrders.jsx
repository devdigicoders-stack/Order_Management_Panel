import React, { useState, useEffect } from 'react';
import { Package, Search, Clock, CheckCircle, X, RefreshCw, Loader2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const StaffOrders = () => {
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.request('/orders');
      setOrdersList(data || []);
    } catch (err) {
      console.warn('Failed to load orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">Draft</span>;
      case 'submitted':
        return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">Submitted</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase">Approved</span>;
      case 'ordered':
        return <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase">Ordered</span>;
      case 'packed':
        return <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase">Packed</span>;
      case 'loaded':
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase">Loaded</span>;
      case 'arrived':
        return <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-bold uppercase">Arrived</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 bg-green-100 text-green-900 rounded-full text-xs font-bold uppercase">Completed</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  const filtered = ordersList.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) || (o.status && o.status.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">My Orders History</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Track order lifecycle from submission through container shipment and arrival.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={loadOrders} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            to="/orders"
            className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 shadow-md flex items-center transition-transform hover:scale-105"
          >
            <Package className="w-4 h-4 mr-1.5" /> Order Grid
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Search by order ID or status..."
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-center font-bold text-gray-600 uppercase">Total Items</th>
                <th className="px-6 py-3 text-center font-bold text-gray-600 uppercase">Total Cuft</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Lifecycle Stage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((order) => (
                <tr key={order.id || order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                    {order.orderNumber || `ORD-${(order.id || order._id).slice(-4)}`}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-gray-500">{order.date || 'Active'}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center font-bold text-gray-800">{order.totalQuantity || 0}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center font-semibold text-gray-600">{order.totalCuft || 0}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    {loading ? 'Loading orders...' : 'No orders recorded.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
