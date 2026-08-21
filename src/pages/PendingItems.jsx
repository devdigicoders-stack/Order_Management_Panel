import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Clock, Search, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';

export const PendingItems = () => {
  const user = useStore(state => state.user);
  const [pendingItems, setPendingItems] = useState([]);
  const [totalPendingQty, setTotalPendingQty] = useState(0);
  const [totalPendingCuft, setTotalPendingCuft] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingItems();
      setPendingItems(data?.pendingItems || []);
      setTotalPendingQty(data?.totalPendingQty || 0);
      setTotalPendingCuft(data?.totalPendingCuft || 0);
    } catch (err) {
      console.warn('Failed to load pending items:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const filtered = pendingItems.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.model?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.company?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">My Pending Items</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Products you have ordered that have not yet been distributed from arrived containers.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-indigo-200 uppercase font-bold">Pending Qty</p>
            <p className="text-lg font-bold text-white">{totalPendingQty} pcs</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-indigo-200 uppercase font-bold">Pending Cuft</p>
            <p className="text-lg font-bold text-white">{totalPendingCuft} cuft</p>
          </div>
          <button onClick={loadPending} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl self-center">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
              placeholder="Search pending products..."
            />
          </div>
          <span className="text-xs text-gray-500 font-mono">
            Auto-calculated: <span className="font-bold text-amber-600">Pending = Ordered − Received</span>
          </span>
        </div>

        <div className="overflow-auto flex-1 relative">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Product Model</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Company</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-600 uppercase">Total Ordered</th>
                <th className="px-6 py-3 text-center font-semibold text-emerald-600 uppercase">Total Received</th>
                <th className="px-6 py-3 text-center font-semibold text-amber-600 uppercase">Still Pending</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600 uppercase">Pending Cuft</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((item) => (
                <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">{item.model}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-500">{item.company}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-gray-700">{item.ordered}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-emerald-600">{item.received}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-amber-600 bg-amber-50/40 text-sm">
                    {item.pending}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right font-semibold text-gray-700">{item.pendingCuft}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <CheckCircle className="w-10 h-10 mb-2 text-emerald-500" />
                      <p className="text-sm font-bold text-gray-900">No Pending Items</p>
                      <p className="text-xs text-gray-400">All your ordered items have been fulfilled and received.</p>
                    </div>
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
