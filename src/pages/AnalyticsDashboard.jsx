import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { Package, Users, Building2, Container as ContainerIcon, ClipboardList, Truck, RefreshCw, Loader2 } from 'lucide-react';
import api from '../services/api';

export const AnalyticsDashboard = () => {
  const user = useStore(state => state.user);
  const navigate = useNavigate();
  
  const [matrixData, setMatrixData] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [containersList, setContainersList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'staff') {
      navigate('/staff/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matrix, staff, containers, pending, products] = await Promise.all([
        api.getOrderMatrix(),
        api.getStaffList(),
        api.getContainers(),
        api.getPendingProducts().catch(() => []),
        api.getProducts()
      ]);

      setMatrixData(matrix?.matrix || []);
      setStaffList(staff || []);
      setContainersList(containers || []);
      setPendingList(pending || []);
      setProductsList(products || []);
    } catch (err) {
      console.warn('Failed to load analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (user?.role === 'staff') return null;

  const totalQty = matrixData.reduce((sum, r) => sum + (r.total || 0), 0);

  // 1. Data for Orders by Company Bar Chart
  const companyDataMap = {};
  matrixData.forEach(row => {
    if (!companyDataMap[row.company]) companyDataMap[row.company] = 0;
    companyDataMap[row.company] += row.total || 0;
  });
  const barData = Object.keys(companyDataMap).map(key => ({ 
    name: key, 
    Orders: companyDataMap[key] 
  }));

  // 2. Data for Staff Orders Area Chart
  const staffOrdersData = staffList.map(s => {
    const sId = s.id || s._id;
    let qty = 0;
    matrixData.forEach(r => {
      qty += Number(r[sId] || 0);
    });
    return { name: s.name.split(' ')[0], Items: qty };
  });

  // 3. Container Space Utilization
  let totalCapacityCuft = 0;
  let usedCapacityCuft = 0;
  containersList.forEach(c => {
    totalCapacityCuft += Number(c.capacity_cuft || c.capacityCuft || 2400);
    usedCapacityCuft += Number(c.used_cuft || c.usedCuft || 0);
  });
  const containerData = [
    { name: 'Used Space (Cuft)', value: Number(usedCapacityCuft.toFixed(2)) },
    { name: 'Free Space (Cuft)', value: Number(Math.max(0, totalCapacityCuft - usedCapacityCuft).toFixed(2)) }
  ];
  const PIE_COLORS = ['#4f46e5', '#e2e8f0'];

  // 4. Top 5 Products
  const topProducts = [...matrixData].sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 5).map(p => ({
    name: p.model,
    qty: p.total,
    company: p.company
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Executive Analytics Overview</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">Real-time business insights, container capacity tracking, and orders overview.</p>
        </div>
        <button onClick={loadData} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <Package className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-500">Total Units Ordered</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{totalQty}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-500">Suppliers</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{Object.keys(companyDataMap).length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-500">Active Staff</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{staffList.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <ContainerIcon className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-500">Containers</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{containersList.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
              <ClipboardList className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-500">Pending Approvals</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{pendingList.length}</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-6">Order Volume by Supplier</h2>
          <div className="flex-1 min-h-[260px] flex items-center justify-center">
            {barData.length > 0 && barData.some(b => b.Orders > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="Orders" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                <Building2 className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No order volume data available yet</p>
                <p className="text-xs text-gray-400 mt-1">Orders will appear here once created</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-6">Items Ordered per Salesperson</h2>
          <div className="flex-1 min-h-[260px] flex items-center justify-center">
            {staffOrdersData.length > 0 && staffOrdersData.some(s => s.Items > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={staffOrdersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Items" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorItems)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                <Users className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No salesperson activity recorded</p>
                <p className="text-xs text-gray-400 mt-1">Staff order metrics will display here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Container Space */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-1">Container Capacity Utilization</h2>
          <p className="text-xs text-gray-500 mb-4">Total Cuft utilization across all active containers.</p>
          <div className="flex-1 min-h-[220px] flex items-center justify-center relative">
            {containersList.length > 0 && totalCapacityCuft > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={containerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {containerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-gray-900">{totalCapacityCuft}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Total Cuft</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                <ContainerIcon className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No active containers</p>
                <p className="text-xs text-gray-400 mt-1">Container stats will appear once added</p>
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Products */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-4">Top 5 Most Ordered Products</h2>
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            {topProducts.length > 0 && topProducts.some(p => p.qty > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart
                  layout="vertical"
                  data={topProducts}
                  margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#374151', fontSize: 12, fontWeight: 600}} width={120} />
                  <Tooltip />
                  <Bar dataKey="qty" name="Quantity Ordered" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                <Package className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No product order history yet</p>
                <p className="text-xs text-gray-400 mt-1">Top ordered products will show here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
