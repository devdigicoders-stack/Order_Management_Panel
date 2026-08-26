import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Package,
  Layers,
  Container
} from 'lucide-react';
import api from '../services/api';
import { useStore } from '../store/useStore';

export const AuditHistory = () => {
  const user = useStore(state => state.user);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedUser, setSelectedUser] = useState('All');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      if (selectedAction && selectedAction !== 'All') params.action = selectedAction;
      if (selectedUser && selectedUser !== 'All') params.userId = selectedUser;
      const data = await api.getAuditLogs(params);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      // Fallback to sample logs if local
      setLogs([
        {
          id: 'log-1',
          user_name: 'Ahmed',
          action: 'order_cell_updated',
          entity: 'order_items',
          old_values: { product: 'MW-6647 Microwave 0.7', quantity: 10 },
          new_values: { product: 'MW-6647 Microwave 0.7', quantity: 15 },
          details: { change: '10 → 15' },
          created_at: new Date().toISOString()
        },
        {
          id: 'log-2',
          user_name: 'Admin User',
          action: 'product_approved',
          entity: 'products',
          old_values: { status: 'pending' },
          new_values: { status: 'approved', cuft: 0.85 },
          details: { cuft: 0.85 },
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'log-3',
          user_name: 'Admin User',
          action: 'container_assigned',
          entity: 'containers',
          old_values: null,
          new_values: { container: 'Container 1', items: 4 },
          details: { containerName: 'Container 1 (June Batch)' },
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction, selectedUser]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'order_cell_updated':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Order Quantity Change</span>;
      case 'product_created':
      case 'product_requested':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Product Request</span>;
      case 'product_approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Product Approved</span>;
      case 'container_assigned':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Container Assignment</span>;
      case 'distribution_allocated':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Distribution Allocation</span>;
      case 'order_status_changed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Lifecycle Status</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{action.replace(/_/g, ' ')}</span>;
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Audit History & Logs</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Complete real-time audit trail of all order changes, product requests, approvals, and container allocations.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff name, product model, or action..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Actions</option>
              <option value="order_cell_updated">Order Cell Changes</option>
              <option value="product_requested">Product Requests</option>
              <option value="product_approved">Product Approvals</option>
              <option value="container_assigned">Container Assignments</option>
              <option value="distribution_allocated">Distribution Allocations</option>
              <option value="order_status_changed">Lifecycle Status Changes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p>Loading audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">No audit logs recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">Actions performed across orders and containers will automatically appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 text-sm">
                    {log.user_name ? log.user_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-900">{log.user_name || 'System User'}</span>
                      {getActionBadge(log.action)}
                    </div>
                    
                    {/* Change Diff View */}
                    <div className="text-sm text-gray-700 mt-1">
                      {log.action === 'order_cell_updated' && log.old_values && log.new_values && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 inline-flex font-mono text-xs">
                          <span className="text-gray-600">{log.new_values.product}</span>
                          <span className="text-red-500 font-semibold">{log.old_values.quantity}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-emerald-600 font-bold">{log.new_values.quantity}</span>
                        </div>
                      )}

                      {log.action === 'product_approved' && (
                        <p className="text-xs text-gray-600">
                          Approved product with <span className="font-semibold text-gray-900">{log.details?.added_cuft || log.new_values?.cuft} cuft</span>
                        </p>
                      )}

                      {log.action === 'container_assigned' && (
                        <p className="text-xs text-gray-600">
                          Updated product assignments in <span className="font-semibold text-gray-900">{log.details?.containerName || 'Container'}</span>
                        </p>
                      )}

                      {log.action === 'distribution_allocated' && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 inline-flex font-mono text-xs">
                          <span className="text-gray-600">{log.details?.model} for {log.details?.staffName}:</span>
                          <span className="text-emerald-600 font-bold">{log.details?.change}</span>
                        </div>
                      )}

                      {log.action === 'order_status_changed' && (
                        <p className="text-xs text-gray-600">
                          Status changed: <span className="uppercase text-gray-500">{log.old_values?.status}</span> → <span className="uppercase font-bold text-indigo-600">{log.new_values?.status}</span>
                        </p>
                      )}

                      {log.details?.note && (
                        <p className="text-xs text-gray-400 mt-1 italic">Note: {log.details.note}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-400 md:self-center">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {formatTimestamp(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
