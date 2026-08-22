import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  ShoppingCart, 
  FileEdit, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Bell, 
  RefreshCw, 
  Loader2, 
  Star, 
  Plus, 
  Minus,
  Sparkles,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import clsx from 'clsx';
import api from '../services/api';

export const StaffDashboard = () => {
  const user = useStore(state => state.user);
  const favorites = useStore(state => state.favorites);
  const toggleFavorite = useStore(state => state.toggleFavorite);
  const fetchFavorites = useStore(state => state.fetchFavorites);
  const updateOrderCell = useStore(state => state.updateOrderCell);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [pendingData, setPendingData] = useState({ pendingItems: [], totalPendingQty: 0 });
  const [receivedData, setReceivedData] = useState({ receivedItems: [], totalReceivedQty: 0 });
  const [notifsData, setNotifsData] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(false);
  const [quickQtys, setQuickQtys] = useState({});
  const [addedSuccess, setAddedSuccess] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [userOrders, pending, received, notifs, prods] = await Promise.all([
        api.request('/orders'),
        api.getPendingItems(),
        api.getReceivedItems(),
        api.getNotifications(),
        api.getProducts(),
        fetchFavorites()
      ]);

      setOrders(userOrders || []);
      setPendingData(pending || { pendingItems: [], totalPendingQty: 0 });
      setReceivedData(received || { receivedItems: [], totalReceivedQty: 0 });
      setNotifsData(notifs || { notifications: [], unreadCount: 0 });
      setProducts(prods || []);
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

  const favoriteProducts = products.filter(p => favorites.includes(p.id || p._id));

  const handleQuickAdd = async (productId) => {
    const qty = Number(quickQtys[productId]) || 1;
    try {
      await updateOrderCell(productId, user?.id, qty);
      setAddedSuccess(prev => ({ ...prev, [productId]: true }));
      setTimeout(() => {
        setAddedSuccess(prev => ({ ...prev, [productId]: false }));
      }, 2000);
      loadData();
    } catch (err) {
      console.error('Failed to add favorite order:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <h1 className="text-xl font-bold text-white">Welcome, {user?.name || 'Salesperson'}</h1>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">Overview of your orders, regular favorites, and shipment status.</p>
        </div>
        <button onClick={loadData} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-colors">
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

      {/* ⭐ Staff Favorite Products (Quick-Order List) */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200/70 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                My Favorite Products
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {favoriteProducts.length} regular items
                </span>
              </h2>
              <p className="text-xs text-gray-500">Quick-order your most frequently requested catalog models in 1 click.</p>
            </div>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Open Full Order Grid</span> →
          </Link>
        </div>

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {favoriteProducts.map((p) => {
              const pId = p.id || p._id;
              const qty = quickQtys[pId] !== undefined ? quickQtys[pId] : 5;
              const isAdded = addedSuccess[pId];

              return (
                <div 
                  key={pId}
                  className="bg-gray-50/80 hover:bg-white border border-gray-200 hover:border-amber-300 rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-wide">
                        {p.company}
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm mt-1">{p.model}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1" title={p.description}>{p.description}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(pId)}
                      className="text-amber-500 hover:text-gray-300 p-1 transition-colors"
                      title="Remove from favorites"
                    >
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-medium text-gray-500">
                      {p.cuft ? `${p.cuft} cuft` : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-inner">
                        <button
                          type="button"
                          onClick={() => setQuickQtys(prev => ({ ...prev, [pId]: Math.max(1, (prev[pId] || 5) - 1) }))}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-xs font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => setQuickQtys({ ...quickQtys, [pId]: Math.max(1, Number(e.target.value)) })}
                          className="w-10 text-center text-xs font-bold text-gray-900 border-x border-gray-200 py-1 focus:outline-none"
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() => setQuickQtys(prev => ({ ...prev, [pId]: (prev[pId] || 5) + 1 }))}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleQuickAdd(pId)}
                        disabled={isAdded}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm",
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95"
                        )}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-amber-50/50 rounded-xl border border-dashed border-amber-200">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">No favorite products added yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Star products in the Order Grid or Product Database to build your 1-click quick order list!
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Browse Products & Star Favorites
            </Link>
          </div>
        )}
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

      {/* Breakdown Chart & Quick Actions */}
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
