import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Loader2, Check } from 'lucide-react';
import api from '../services/api';

export const Export = () => {
  const [companies, setCompanies] = useState(['PREMIER', 'MIDEA', 'SAMSUNG', 'SONY']);
  const [selectedCompany, setSelectedCompany] = useState('PREMIER');
  const [format, setFormat] = useState('csv');
  const [poData, setPoData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCompanies = async () => {
    try {
      const list = await api.getCompanies();
      if (list?.length > 0) {
        setCompanies(list);
        if (!list.includes(selectedCompany)) setSelectedCompany(list[0]);
      }
    } catch (e) {
      console.warn('Companies load error:', e.message);
    }
  };

  const loadPO = async () => {
    if (!selectedCompany) return;
    setLoading(true);
    try {
      const data = await api.getPurchaseOrderExport(selectedCompany);
      setPoData(data);
    } catch (err) {
      console.warn('Failed to load purchase order:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadPO();
  }, [selectedCompany]);

  const items = poData?.items || [];

  const handleDownload = () => {
    if (!items.length) return;

    if (format === 'csv') {
      const headers = ['Model', 'Description', 'Total Quantity', 'Unit Cuft', 'Total Cuft'];
      const rows = items.map(i => [
        i.model,
        `"${i.description.replace(/"/g, '""')}"`,
        i.totalQuantity,
        i.cuft,
        i.totalCuft
      ]);
      rows.push(['GRAND TOTAL', '', poData.grandTotalQuantity, '', poData.grandTotalCubicFeet]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${poData.purchaseOrderNumber || 'PO'}_${selectedCompany}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col mb-10">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <h1 className="text-xl font-bold text-white">Export Purchase Orders</h1>
        <p className="text-indigo-100 text-sm mt-1 opacity-90">
          Generate supplier-wise purchase orders showing only totals per model number.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[460px]">
        {/* Settings */}
        <div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5 h-fit">
          <h2 className="font-bold text-gray-900 flex items-center text-base">
            <div className="p-2 bg-indigo-50 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            Export Settings
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Supplier</label>
            <select 
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-semibold"
            >
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Export Format</label>
            <select 
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="csv">CSV File (.csv)</option>
              <option value="print">Print / PDF Document</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button 
              onClick={handleDownload}
              disabled={items.length === 0}
              className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" /> Download Purchase Order
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="md:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center rounded-t-xl">
            <h2 className="font-bold text-gray-900 text-sm">Purchase Order Preview</h2>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
              {poData?.purchaseOrderNumber || 'PO-PREVIEW'}
            </span>
          </div>
          
          <div className="p-6 md:p-8 bg-white flex-1 overflow-y-auto">
            <div className="text-center mb-6 pb-4 border-b border-gray-200">
              <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{selectedCompany} PURCHASE ORDER</h1>
              <p className="text-xs text-gray-500 mt-1">Date: {poData?.date || new Date().toISOString().split('T')[0]}</p>
            </div>

            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="py-2.5 text-left font-bold text-gray-900 uppercase">Model</th>
                  <th className="py-2.5 text-left font-bold text-gray-900 uppercase">Description</th>
                  <th className="py-2.5 text-center font-bold text-gray-900 uppercase">Total Qty</th>
                  <th className="py-2.5 text-right font-bold text-gray-900 uppercase">Total Cuft</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.productId}>
                    <td className="py-2.5 font-bold text-gray-900 font-mono">{item.model}</td>
                    <td className="py-2.5 text-gray-600">{item.description}</td>
                    <td className="py-2.5 font-bold text-gray-900 text-center">{item.totalQuantity}</td>
                    <td className="py-2.5 text-gray-700 text-right">{item.totalCuft}</td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400">
                      {loading ? 'Generating purchase order...' : 'No ordered products found for this company.'}
                    </td>
                  </tr>
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-900 bg-gray-50/80 font-bold">
                    <td colSpan="2" className="py-3 text-right pr-4 uppercase text-gray-900">
                      Grand Total
                    </td>
                    <td className="py-3 text-center text-indigo-700 text-sm">
                      {poData?.grandTotalQuantity}
                    </td>
                    <td className="py-3 text-right text-emerald-700 text-sm">
                      {poData?.grandTotalCubicFeet} cuft
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
