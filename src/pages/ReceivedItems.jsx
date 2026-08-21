import React, { useState, useEffect } from 'react';
import { Search, Truck, PackageCheck, RefreshCw, Loader2 } from 'lucide-react';
import api from '../services/api';

export const ReceivedItems = () => {
  const [receivedItems, setReceivedItems] = useState([]);
  const [totalReceivedQty, setTotalReceivedQty] = useState(0);
  const [totalReceivedCuft, setTotalReceivedCuft] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadReceived = async () => {
    setLoading(true);
    try {
      const data = await api.getReceivedItems();
      setReceivedItems(data?.receivedItems || []);
      setTotalReceivedQty(data?.totalReceivedQty || 0);
      setTotalReceivedCuft(data?.totalReceivedCuft || 0);
    } catch (err) {
      console.warn('Failed to load received items:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceived();
  }, []);

  const filtered = receivedItems.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.model?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.containerName?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">My Received Items</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Items that have been allocated and delivered to you from arrived containers.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-indigo-200 uppercase font-bold">Received Qty</p>
            <p className="text-lg font-bold text-white">{totalReceivedQty} pcs</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-indigo-200 uppercase font-bold">Total Cuft</p>
            <p className="text-lg font-bold text-white">{totalReceivedCuft} cuft</p>
          </div>
          <button onClick={loadReceived} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl self-center">
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
              placeholder="Search received products or containers..."
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Product Model</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Company</th>
                <th className="px-6 py-3 text-center font-semibold text-emerald-600 uppercase">Qty Received</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Container Source</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600 uppercase">Cuft</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">{item.model}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-600">{item.description}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-500">{item.company}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-emerald-600 text-sm">{item.quantityReceived}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                      <Truck className="w-3 h-3 mr-1 text-indigo-500" /> {item.containerName}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right font-semibold text-gray-700">{item.totalCuft}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <PackageCheck className="w-10 h-10 mb-2 text-gray-300" />
                      <p className="text-sm font-bold text-gray-900">No Received Items</p>
                      <p className="text-xs text-gray-400">Containers that arrive and distribute items to you will appear here.</p>
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
