import React, { useState, useEffect } from 'react';
import { Package, Search, Clock, CheckCircle, X, RefreshCw, Loader2, Eye, Layers, Send, Plus, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { AlertModal } from '../components/ui/AlertModal';
import api from '../services/api';
import clsx from 'clsx';

export const StaffOrders = () => {
  const user = useStore(state => state.user);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  
  // Add Product to Order State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addProductQty, setAddProductQty] = useState(1);
  const [addingProduct, setAddingProduct] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const loadProducts = async () => {
    try {
      const prods = await api.getProducts();
      setProductsList(prods || []);
      if (prods && prods.length > 0) {
        setSelectedProductId(prods[0].id || prods[0]._id);
      }
    } catch (err) {
      console.warn("Failed to load products:", err.message);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setOrderNotes(order.notes || '');
    setShowAddProduct(false);
  };

  const handleAddProductToOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !selectedProductId || Number(addProductQty) <= 0) return;

    setAddingProduct(true);
    try {
      const orderId = selectedOrder.id || selectedOrder._id;
      const res = await api.addProductToOrder(orderId, {
        productId: selectedProductId,
        quantity: Number(addProductQty)
      });

      setAlertConfig({
        isOpen: true,
        title: res.isNewOrder ? "New Order Created!" : "Product Added",
        message: res.message || "Product added successfully.",
        type: "success"
      });

      setShowAddProduct(false);
      setAddProductQty(1);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Failed to Add Product",
        message: err.message || "An error occurred while adding the product.",
        type: "danger"
      });
    } finally {
      setAddingProduct(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setSavingNotes(true);
    try {
      const orderId = selectedOrder.id || selectedOrder._id;
      await api.updateOrderNotes(orderId, orderNotes);
      // Update local lists
      setOrdersList(prev => prev.map(o => (o.id === orderId || o._id === orderId) ? { ...o, notes: orderNotes } : o));
      setSelectedOrder(prev => ({ ...prev, notes: orderNotes }));
    } catch (err) {
      console.warn("Failed to save notes:", err.message);
    } finally {
      setSavingNotes(false);
    }
  };

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
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) || 
      (o.status && o.status.toLowerCase().includes(q)) ||
      (o.batchNumber && o.batchNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 h-full flex flex-col mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 md:p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <span>Orders: <span className="underline decoration-indigo-300">{user?.name || 'Staff'}</span></span>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
            </h1>
          </div>
          <p className="text-indigo-100 text-xs md:text-sm mt-1 opacity-90">
            Track order lifecycle batches from initial submission through supplementary addendums and supplier orders.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button onClick={loadOrders} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            to="/orders"
            className="flex-1 md:flex-initial justify-center bg-white text-indigo-700 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-indigo-50 shadow-md flex items-center transition-transform hover:scale-105"
          >
            <Package className="w-4 h-4 mr-1.5" /> Order Grid
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick Status Chips (Less Scrolling) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['all', 'draft', 'submitted', 'approved', 'ordered', 'completed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all",
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Search by ID, batch..."
            />
          </div>
        </div>

        {/* Mobile Cards View (Zero Horizontal Scroll) */}
        <div className="md:hidden p-3 space-y-3 overflow-y-auto">
          {filtered.map((order) => (
            <div 
              key={order.id || order._id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {order.orderNumber || `ORD-${(order.id || order._id).slice(-4)}`}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1",
                      order.batchNumber?.includes('Addendum')
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-gray-100 text-gray-700"
                    )}>
                      <Layers className="w-3 h-3" />
                      {order.batchNumber || 'Batch 1'}
                    </span>
                    <span className="text-[11px] text-gray-400">• {order.date || 'Active'}</span>
                  </div>
                </div>

                <div>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50/80 p-2.5 rounded-xl text-xs">
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Total Items</span>
                  <span className="font-bold text-gray-900 text-sm">{order.totalQuantity || 0} pcs</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Total Volume</span>
                  <span className="font-bold text-gray-900 text-sm">{order.totalCuft || 0} cuft</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  {order.isSentToSupplier ? (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-semibold flex items-center gap-1">
                      <Send className="w-3 h-3" /> Sent to Supplier
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold">
                      Pending PO Send
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleSelectOrder(order)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Details
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-xs">
              {loading ? 'Loading orders...' : 'No orders found matching filters.'}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-auto flex-1 relative">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Batch Info</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-center font-bold text-gray-600 uppercase">Total Items</th>
                <th className="px-6 py-3 text-center font-bold text-gray-600 uppercase">Total Cuft</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Supplier Status</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Lifecycle Stage</th>
                <th className="px-6 py-3 text-right font-bold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((order) => (
                <tr key={order.id || order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                    {order.orderNumber || `ORD-${(order.id || order._id).slice(-4)}`}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1",
                      order.batchNumber?.includes('Addendum')
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-gray-100 text-gray-700"
                    )}>
                      <Layers className="w-3 h-3" />
                      {order.batchNumber || 'Batch 1'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-gray-500">{order.date || 'Active'}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center font-bold text-gray-800">{order.totalQuantity || 0}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center font-semibold text-gray-600">{order.totalCuft || 0}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {order.isSentToSupplier ? (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
                        <Send className="w-3 h-3" /> Sent to Supplier
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-semibold w-fit">
                        Pending PO Send
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleSelectOrder(order)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded text-xs font-semibold flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    {loading ? 'Loading orders...' : 'No orders recorded.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <span>Order Details: {selectedOrder.orderNumber}</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                    {selectedOrder.batchNumber || 'Batch 1'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Date: {selectedOrder.date} • Status: {selectedOrder.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(prev => !prev)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddProduct ? 'Cancel' : 'Add Product'}
                </button>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add Product Inline Form */}
            {showAddProduct && (
              <form onSubmit={handleAddProductToOrder} className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-800 text-[11px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  <p>
                    <strong>New Order Policy:</strong> Since this order is already <strong>{selectedOrder.status}</strong>, adding a new product will automatically create a <strong>NEW ORDER</strong> batch!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Select Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    >
                      {productsList.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.model} - {p.description} ({p.company}) [{p.cuft || 0} cuft]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={addProductQty}
                      onChange={(e) => setAddProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white font-bold text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingProduct}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    {addingProduct ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating New Order...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Create as New Order
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 text-xs">
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900">{item.model || 'Model'}</span>
                    <span className="text-gray-400 ml-2">({item.company || 'Supplier'})</span>
                    <p className="text-gray-500 text-[11px]">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-600 text-sm">x{item.quantity}</span>
                    <p className="text-gray-400 text-[10px]">{item.unitCuft ? `${item.unitCuft} cuft/ea` : ''}</p>
                  </div>
                </div>
              ))}
              {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                <p className="text-center py-6 text-gray-400">No items listed in this batch.</p>
              )}
            </div>

            {/* Order Notes Section */}
            <div className="pt-3 border-t border-gray-100 space-y-1 text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Order Notes</span>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Write order details, instructions, or supplier remarks..."
                className="w-full border border-gray-300 rounded-lg text-xs p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/50"
                rows="2"
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-500">Total Volume: </span>
                <span className="font-bold text-gray-900">{selectedOrder.totalCuft || 0} cuft</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
};
