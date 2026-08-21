import React, { useState, useEffect } from 'react';
import { User, Download, RefreshCw, Loader2, PackageCheck, Clock } from 'lucide-react';
import api from '../services/api';

export const StaffView = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStaff = async () => {
    try {
      const list = await api.getStaffList();
      setStaffList(list || []);
      if (list?.length > 0 && !selectedStaffId) {
        setSelectedStaffId(list[0].id || list[0]._id);
      }
    } catch (err) {
      console.warn('Failed to load staff:', err.message);
    }
  };

  const loadStaffDetails = async () => {
    if (!selectedStaffId) return;
    setLoading(true);
    try {
      const data = await api.getStaffView(selectedStaffId);
      setStaffData(data);
    } catch (err) {
      console.warn('Failed to load staff details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    loadStaffDetails();
  }, [selectedStaffId]);

  const breakdown = staffData?.breakdown || {};
  const currentStaff = staffList.find(s => (s.id || s._id) === selectedStaffId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Salesperson Order Breakdown</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Individual salesperson order summary grouped by supplier companies.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="flex-1 md:flex-none border border-transparent rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-white bg-white/10 text-white [&>option]:text-gray-900 focus:outline-none"
          >
            {staffList.map(s => (
              <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
            ))}
          </select>

          <button 
            onClick={loadStaffDetails}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Staff Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between mb-6 pb-6 border-b border-gray-100 gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentStaff?.name || 'Salesperson'}</h2>
              <p className="text-gray-500 text-xs">{currentStaff?.email || ''}</p>
            </div>
          </div>

          <div className="flex gap-4 text-center">
            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Quantity</p>
              <p className="text-lg font-bold text-indigo-600">{staffData?.totalQuantity || 0} pcs</p>
            </div>
            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Cuft</p>
              <p className="text-lg font-bold text-emerald-600">{staffData?.totalCubicFeet || 0} cuft</p>
            </div>
          </div>
        </div>

        {/* Company Groups */}
        <div className="space-y-6">
          {Object.entries(breakdown).map(([company, items]) => (
            <div key={company} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">{company}</span>
                <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono font-bold">
                  {items.reduce((s, i) => s + (i.quantity || 0), 0)} items
                </span>
              </div>

              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Model</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Description</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-600">Quantity</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-600">Unit Cuft</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600">Total Cuft</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-bold text-gray-900">{item.model}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.description}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-indigo-600">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-center text-gray-500">{item.unitCuft}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{item.totalCuft}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {Object.keys(breakdown).length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No orders found for this salesperson.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
