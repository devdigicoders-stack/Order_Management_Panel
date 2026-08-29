import React, { useState, useEffect } from 'react';
import { Building2, Download, RefreshCw, Loader2, Package, Send, Merge, CheckCircle, Layers, AlertCircle, X } from 'lucide-react';
import { AlertModal } from '../components/ui/AlertModal';
import api from '../services/api';
import clsx from 'clsx';

export const CompanyView = () => {
  const [companies, setCompanies] = useState(['PREMIER', 'MIDEA', 'SAMSUNG', 'SONY']);
  const [selectedCompany, setSelectedCompany] = useState('PREMIER');
  const [companyData, setCompanyData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [showSendModal, setShowSendModal] = useState(false);
  const [orderToSend, setOrderToSend] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const loadCompanies = async () => {
    try {
      const list = await api.getCompanies();
      if (list?.length > 0) {
        setCompanies(list);
        if (!list.includes(selectedCompany)) setSelectedCompany(list[0]);
      }
    } catch (e) {
      console.warn('Companies list load error:', e.message);
    }
  };

  const loadCompanyDetails = async () => {
    if (!selectedCompany) return;
    setLoading(true);
    try {
      const [data, allOrders] = await Promise.all([
        api.getCompanyView(selectedCompany),
        api.request('/orders')
      ]);
      setCompanyData(data);
      setOrders(allOrders || []);
    } catch (err) {
      console.warn('Failed to load company view:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadCompanyDetails();
  }, [selectedCompany]);

  const products = (companyData?.products || []).filter(p => p.totalQty > 0);

  // Filter orders relevant to this company
  const companyOrders = orders.filter(o => 
    (o.items || []).some(i => i.company?.toLowerCase() === selectedCompany.toLowerCase()) ||
    o.company?.toLowerCase() === selectedCompany.toLowerCase()
  );

  const handleMarkSent = async (orderId) => {
    setActionLoading(true);
    try {
      await api.markOrderSent(orderId);
      setAlertConfig({
        isOpen: true,
        title: "Purchase Order Sent",
        message: "Order batch marked as Sent to Supplier successfully.",
        type: "success"
      });
      loadCompanyDetails();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to update order status.",
        type: "danger"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSendModal = (order) => {
    setOrderToSend(order);
    const ids = (order.items || []).map(i => i.productId);
    setSelectedProductIds(ids);
    setShowSendModal(true);
  };

  const handleConfirmSend = async () => {
    if (!orderToSend) return;
    setActionLoading(true);
    try {
      const orderId = orderToSend.id || orderToSend._id;
      const isSubset = selectedProductIds.length > 0 && selectedProductIds.length < (orderToSend.items || []).length;
      await api.markOrderSent(orderId, isSubset ? selectedProductIds : null);
      setAlertConfig({
        isOpen: true,
        title: "Purchase Order Sent",
        message: isSubset 
          ? "Selected items marked as Sent to Supplier. Remaining items split into a new batch."
          : "Full order batch marked as Sent to Supplier successfully.",
        type: "success"
      });
      setShowSendModal(false);
      setOrderToSend(null);
      loadCompanyDetails();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to update order status.",
        type: "danger"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCombineBatches = async (addendumOrderId, mainOrderId) => {
    setActionLoading(true);
    try {
      await api.combineOrders(addendumOrderId, mainOrderId);
      setAlertConfig({
        isOpen: true,
        title: "Orders Combined",
        message: "Addendum batch successfully merged with the primary order!",
        type: "success"
      });
      loadCompanyDetails();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Combine Failed",
        message: err.message || "Failed to combine order batches.",
        type: "danger"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!products.length) return;
    const headers = ['Model', 'Description', 'Cuft', 'Total Quantity', 'Total Cuft', 'Staff Breakdown'];
    const rows = products.map(p => [
      p.model,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.cuft,
      p.totalQty,
      p.totalCuft,
      `"${(p.buyers || []).map(b => `${b.staffName}: ${b.quantity}`).join(', ')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Company_Orders_${selectedCompany}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mainOrder = companyOrders.find(o => !o.batchNumber?.includes('Addendum')) || companyOrders[0];
  const addendumOrders = companyOrders.filter(o => o.batchNumber?.includes('Addendum') || o.id !== mainOrder?.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Company View & PO Batches</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Supplier-wise breakdown of all products ordered, purchase order batches, and revision merge controls.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="flex-1 md:flex-none border border-transparent rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-white bg-white/10 text-white [&>option]:text-gray-900 focus:outline-none"
          >
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <button 
            onClick={loadCompanyDetails} 
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button 
            onClick={handleExportCSV}
            className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 shadow-md flex items-center transition-transform hover:scale-105"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export PO
          </button>
        </div>
      </div>

      {/* Incremental PO Batches Management Banner */}
      {companyOrders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Purchase Order Batches for {selectedCompany}</span>
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {companyOrders.length} active batch{companyOrders.length > 1 ? 'es' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {companyOrders.map((ord) => {
              const isAddendum = ord.batchNumber?.includes('Addendum');
              const isSent = ord.isSentToSupplier;

              return (
                <div 
                  key={ord.id || ord._id} 
                  className={clsx(
                    "p-3.5 rounded-xl border flex flex-col justify-between gap-3 text-xs transition-all",
                    isAddendum ? "bg-purple-50/50 border-purple-200" : "bg-gray-50/80 border-gray-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">{ord.orderNumber}</span>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          isAddendum ? "bg-purple-200 text-purple-900" : "bg-indigo-100 text-indigo-800"
                        )}>
                          {ord.batchNumber || 'Batch 1'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Staff: {ord.staffName} • Total: {ord.totalQuantity || 0} pcs ({ord.totalCuft || 0} cuft)
                      </p>
                    </div>

                    <div>
                      {isSent ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Sent to Supplier
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Pending PO Send
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes Area in Batch Card */}
                  <div className="mt-1 space-y-1 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Notes</label>
                    <textarea
                      defaultValue={ord.notes || ''}
                      onBlur={async (e) => {
                        const val = e.target.value;
                        if (val !== (ord.notes || '')) {
                          try {
                            await api.updateOrderNotes(ord.id || ord._id, val);
                            setOrders(prev => prev.map(o => (o.id === ord.id || o._id === ord._id) ? { ...o, notes: val } : o));
                          } catch (err) {
                            console.warn("Failed to update notes:", err.message);
                          }
                        }
                      }}
                      placeholder="Add notes for this batch..."
                      className="w-full border border-gray-200 rounded p-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows="1"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200/60">
                    {!isSent && (
                      <button
                        onClick={() => handleOpenSendModal(ord)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Send className="w-3 h-3" /> Mark as Sent to Supplier
                      </button>
                    )}

                    {isAddendum && mainOrder && (
                      <button
                        onClick={() => handleCombineBatches(ord.id || ord._id, mainOrder.id || mainOrder._id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                        title="Merge this addendum into the main purchase order"
                      >
                        <Merge className="w-3 h-3" /> Combine with Main Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supplier Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedCompany}</h2>
              <p className="text-gray-500 text-xs font-medium">Supplier Catalog Order Summary</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 text-center">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Quantity</p>
              <p className="text-lg font-bold text-indigo-600">{companyData?.totalCompanyQty || 0} pcs</p>
            </div>
            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 text-center">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Cuft</p>
              <p className="text-lg font-bold text-emerald-600">{companyData?.totalCompanyCuft || 0} cuft</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {products.map(product => (
            <div key={product.productId} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white hover:border-indigo-300 transition-colors">
              <div className="bg-gray-50/70 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{product.model}</h3>
                  <p className="text-xs text-gray-500">{product.description}</p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Total: {product.totalQty} ({product.totalCuft} cuft)
                </span>
              </div>

              <div className="p-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ordered By Staff</h4>
                <div className="flex flex-wrap gap-2">
                  {(product.buyers || []).map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-xs">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                        {b.staffName?.charAt(0) || 'S'}
                      </div>
                      <span className="font-semibold text-gray-700">{b.staffName}</span>
                      <span className="font-bold text-indigo-600">x{b.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium text-sm">No active orders recorded for {selectedCompany}.</p>
            </div>
          )}
        </div>
      </div>

      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      {/* Partial Send Modal */}
      {showSendModal && orderToSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { setShowSendModal(false); setOrderToSend(null); }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">
                Send PO: {orderToSend.orderNumber}
              </h3>
              <button onClick={() => { setShowSendModal(false); setOrderToSend(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Select the items you wish to send to the supplier now. Unselected items will remain in a remainder batch.
            </p>

            <div className="space-y-2 overflow-y-auto flex-1 divide-y divide-gray-100 pr-1">
              {(orderToSend.items || []).map((item) => {
                const isChecked = selectedProductIds.includes(item.productId);
                return (
                  <label 
                    key={item.productId}
                    className="flex items-start gap-3 py-3 cursor-pointer text-xs"
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedProductIds(prev => 
                          prev.includes(item.productId)
                            ? prev.filter(id => id !== item.productId)
                            : [...prev, item.productId]
                        );
                      }}
                      className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{item.model}</span>
                        <span className="text-indigo-600">x{item.quantity}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setShowSendModal(false); setOrderToSend(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={actionLoading || selectedProductIds.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
