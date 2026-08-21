import React, { useState, useEffect } from 'react';
import { Building2, Download, RefreshCw, Loader2, Package } from 'lucide-react';
import api from '../services/api';

export const CompanyView = () => {
  const [companies, setCompanies] = useState(['PREMIER', 'MIDEA', 'SAMSUNG', 'SONY']);
  const [selectedCompany, setSelectedCompany] = useState('PREMIER');
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);

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
      const data = await api.getCompanyView(selectedCompany);
      setCompanyData(data);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Company View</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Supplier-wise breakdown of all products ordered with who ordered each item.
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
            <Download className="w-4 h-4 mr-1.5" /> Export
          </button>
        </div>
      </div>

      {/* Supplier Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedCompany}</h2>
              <p className="text-gray-500 text-xs font-medium">Supplier Catalog Breakdown</p>
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
    </div>
  );
};
