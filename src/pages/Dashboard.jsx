import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';
import { 
  Filter, 
  Download, 
  Search, 
  RefreshCw, 
  Loader2, 
  Star, 
  Plus, 
  Minus, 
  User, 
  LayoutGrid, 
  Table as TableIcon, 
  ShoppingBag, 
  Check, 
  Layers,
  X
} from 'lucide-react';
import { AlertModal } from '../components/ui/AlertModal';
import clsx from 'clsx';

const EditableOrderCell = ({ getValue, row, column, table }) => {
  const initialValue = getValue() || 0;
  const [value, setValue] = useState(initialValue);
  const updateOrderCell = useStore(state => state.updateOrderCell);
  
  const onBlur = () => {
    const productId = row.original.id;
    const staffId = column.id;
    if (Number(value) !== Number(initialValue)) {
      updateOrderCell(productId, staffId, Number(value) || 0);
    }
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Only the staff member this column belongs to can edit, or if user is admin
  const currentUserId = table.options.meta?.userId?.toString();
  const columnStaffId = column.id?.toString();
  const isEditable = (table.options.meta?.userRole === 'staff' && currentUserId === columnStaffId) || table.options.meta?.userRole === 'admin';

  if (!isEditable) {
    return Number(value) > 0 ? (
      <span className="inline-flex items-center justify-center font-bold text-gray-800 bg-gray-100/90 border border-gray-200 min-w-[36px] px-2 py-0.5 rounded text-xs">
        {value}
      </span>
    ) : (
      <span className="text-gray-300 font-light">-</span>
    );
  }

  return (
    <input
      type="number"
      value={value === 0 ? '' : value}
      placeholder="0"
      onChange={e => setValue(e.target.value === '' ? 0 : Number(e.target.value))}
      onBlur={onBlur}
      className={`w-16 border rounded text-center text-sm py-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm ${
        Number(value) > 0 ? 'border-indigo-300 bg-indigo-50/70 font-semibold text-indigo-900' : 'border-gray-200 text-gray-600'
      }`}
      min="0"
    />
  );
};

export const Dashboard = () => {
  const user = useStore(state => state.user);
  const orderMatrix = useStore(state => state.orderMatrix);
  const staff = useStore(state => state.staff);
  const favorites = useStore(state => state.favorites);
  const toggleFavorite = useStore(state => state.toggleFavorite);
  const fetchFavorites = useStore(state => state.fetchFavorites);
  const fetchOrderMatrix = useStore(state => state.fetchOrderMatrix);
  const submitDraftOrders = useStore(state => state.submitDraftOrders);
  const updateOrderCell = useStore(state => state.updateOrderCell);

  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [companies, setCompanies] = useState(['All', 'PREMIER', 'MIDEA', 'SAMSUNG', 'SONY']);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  // Mobile optimization states
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'ordered', 'favorites'
  const [mobileViewMode, setMobileViewMode] = useState('cards'); // 'cards' or 'table'
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Active staff determination
  const activeStaffId = useMemo(() => {
    if (user?.role === 'staff') {
      return (user?.id || user?._id)?.toString();
    }
    if (selectedStaffId) {
      return selectedStaffId.toString();
    }
    return (staff[0]?.id || staff[0]?._id)?.toString() || '';
  }, [user, selectedStaffId, staff]);

  const activeStaffMember = useMemo(() => {
    if (user?.role === 'staff') return user;
    return (staff || []).find(s => (s.id || s._id)?.toString() === activeStaffId) || staff[0] || null;
  }, [user, staff, activeStaffId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [
        fetchOrderMatrix({
          company: selectedCompany !== 'All' ? selectedCompany : undefined,
          search: globalFilter || undefined
        })
      ];
      if (user?.role === 'staff') {
        promises.push(fetchFavorites());
      }
      const [data] = await Promise.all(promises);
      if (data?.matrix) {
        const uniqueCompanies = ['All', ...new Set(data.matrix.map(p => p.company))];
        setCompanies(uniqueCompanies);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedStaffId && staff && staff.length > 0) {
      setSelectedStaffId((staff[0].id || staff[0]._id)?.toString());
    }
  }, [staff]);

  // Compute Matrix Data with Fast Filter Tabs for Less Scrolling
  const data = useMemo(() => {
    let list = orderMatrix || [];

    // Filter Tab (All, My Ordered, Favorites)
    if (filterTab === 'favorites') {
      list = list.filter(r => favorites.includes(r.id || r._id));
    } else if (filterTab === 'ordered' && activeStaffId) {
      list = list.filter(r => Number(r[activeStaffId]) > 0);
    }

    // Search filter
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(r => 
        (r.model && r.model.toLowerCase().includes(q)) || 
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [orderMatrix, globalFilter, filterTab, favorites, activeStaffId]);

  // My Totals calculation
  const myTotalQty = useMemo(() => {
    if (!activeStaffId) return 0;
    return (orderMatrix || []).reduce((sum, r) => sum + (Number(r[activeStaffId]) || 0), 0);
  }, [orderMatrix, activeStaffId]);

  const myTotalCuft = useMemo(() => {
    if (!activeStaffId) return 0;
    return Number((orderMatrix || []).reduce((sum, r) => sum + ((Number(r[activeStaffId]) || 0) * (r.cuft || 0)), 0).toFixed(2));
  }, [orderMatrix, activeStaffId]);

  const myOrderedCount = useMemo(() => {
    if (!activeStaffId) return 0;
    return (orderMatrix || []).filter(r => Number(r[activeStaffId]) > 0).length;
  }, [orderMatrix, activeStaffId]);

  // Stepper handlers for Mobile Cards
  const handleStepperChange = (productId, delta) => {
    if (!activeStaffId) return;
    const currentItem = (orderMatrix || []).find(r => (r.id === productId || r._id === productId));
    const currentQty = Number(currentItem?.[activeStaffId] || 0);
    const newQty = Math.max(0, currentQty + delta);
    updateOrderCell(productId, activeStaffId, newQty);
  };

  const handleDirectInputChange = (productId, val) => {
    if (!activeStaffId) return;
    const newQty = Math.max(0, parseInt(val) || 0);
    updateOrderCell(productId, activeStaffId, newQty);
  };

  // Define Columns dynamically based on Staff for Desktop
  const columns = useMemo(() => {
    const isStaff = user?.role === 'staff';
    const cols = [
      {
        accessorKey: 'model',
        header: 'Model',
        cell: info => {
          const rowId = info.row.original.id;
          const isFav = favorites.includes(rowId);
          return (
            <div className="flex items-center gap-1.5">
              {isStaff && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(rowId);
                  }}
                  className="p-1 hover:bg-gray-100 rounded text-gray-300 hover:text-amber-500 transition-colors"
                  title={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={clsx("w-3.5 h-3.5", isFav ? "fill-amber-400 text-amber-500" : "text-gray-300")} />
                </button>
              )}
              <span className="font-semibold text-gray-900">{info.getValue()}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: info => (
          <span className="text-gray-500 truncate block w-44" title={info.getValue()}>
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total Qty',
        cell: info => (
          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
            {info.getValue() || 0}
          </span>
        ),
      }
    ];

    (staff || []).forEach(s => {
      const staffKey = s.id?.toString() || s._id?.toString();
      cols.push({
        accessorKey: staffKey,
        header: s.name,
        cell: EditableOrderCell,
      });
    });

    return cols;
  }, [staff, user?.role, favorites]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      userRole: user?.role,
      userId: user?.id || user?._id,
    }
  });

  const handleSubmitOrders = async () => {
    setSubmitting(true);
    try {
      const res = await submitDraftOrders();
      setAlertConfig({
        isOpen: true,
        title: "Orders Submitted",
        message: res?.message || "Your order quantities have been successfully saved and submitted for admin review!",
        type: "success"
      });
      loadData();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Submission Status",
        message: err.message || "Please enter quantities in your column before submitting.",
        type: "info"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (!orderMatrix.length) return;
    const headers = ['Model', 'Description', 'Company', 'CuFt', 'Total Qty', ...(staff || []).map(s => s.name)];
    const rows = orderMatrix.map(r => [
      `"${r.model || ''}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${r.company || ''}"`,
      r.cuft || 0,
      r.total,
      ...(staff || []).map(s => r[s.id?.toString() || s._id?.toString()] || 0)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OMS_Orders_Matrix_${selectedCompany}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 md:space-y-6 h-full flex flex-col mb-16 md:mb-10">
      {/* Top Banner with Staff Identification */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 p-4 md:p-6 rounded-2xl shadow-md text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                Orders Dashboard
                {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
              </h1>
            </div>

            {/* Prominent Staff Name Display */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                <User className="w-3.5 h-3.5 text-indigo-200" />
                <span>Salesperson: <strong className="text-white underline decoration-indigo-300">{activeStaffMember?.name || user?.name || 'Staff'}</strong></span>
              </div>

              {user?.role === 'admin' && staff && staff.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-indigo-200 hidden sm:inline">Switch:</span>
                  <select
                    value={activeStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1 rounded-full border border-white/20 focus:outline-none focus:bg-indigo-900"
                  >
                    {staff.map(s => (
                      <option key={s.id || s._id} value={(s.id || s._id)?.toString()} className="text-gray-900">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button 
              onClick={loadData}
              title="Refresh Data"
              className="bg-white/10 border border-transparent text-white p-2 rounded-xl hover:bg-white/20 flex items-center shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {user?.role === 'staff' ? (
              <button 
                onClick={handleSubmitOrders}
                disabled={submitting || loading}
                className="flex-1 md:flex-none justify-center bg-white text-indigo-700 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-indigo-50 shadow-md flex items-center transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    Submit Orders
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={handleExportCSV}
                className="flex-1 md:flex-none justify-center bg-white text-indigo-700 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:bg-indigo-50 shadow-md flex items-center transition-transform"
              >
                <Download className="w-4 h-4 mr-1.5" /> Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Control Bar (Optimized for Mobile with Less Scrolling) */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
        {/* Fast Filter Tabs (All / My Ordered / Favorites) */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={clsx(
                "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                filterTab === 'all'
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              All Items ({orderMatrix.length})
            </button>

            <button
              onClick={() => setFilterTab('ordered')}
              className={clsx(
                "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
                filterTab === 'ordered'
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <span>My Ordered</span>
              {myOrderedCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {myOrderedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab('favorites')}
              className={clsx(
                "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
                filterTab === 'favorites'
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>Favorites ({favorites.length})</span>
            </button>
          </div>

          {/* Mobile View Mode Switcher (Cards vs Table) */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <span className="text-xs text-gray-500 sm:hidden">
              Showing <strong>{data.length}</strong> items
            </span>

            <div className="md:hidden flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              <button
                onClick={() => setMobileViewMode('cards')}
                className={clsx(
                  "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1",
                  mobileViewMode === 'cards' ? "bg-white text-indigo-700 shadow-xs" : "text-gray-500"
                )}
                title="Cards View (Zero Horizontal Scroll)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setMobileViewMode('table')}
                className={clsx(
                  "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1",
                  mobileViewMode === 'table' ? "bg-white text-indigo-700 shadow-xs" : "text-gray-500"
                )}
                title="Full Grid Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Company Pills & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-gray-100">
          {/* Horizontally Scrollable Company Chips (Single Tap for Less Scrolling) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {companies.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCompany(c)}
                className={clsx(
                  "whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0",
                  selectedCompany === c
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search model or specs..." 
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            {globalFilter && (
              <button 
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE-OPTIMIZED CARD VIEW (Zero Horizontal Scrolling) */}
      <div className={clsx("md:hidden space-y-3", mobileViewMode !== 'cards' && "hidden")}>
        {data.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 text-xs">
            {filterTab === 'ordered' ? (
              <div className="space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-gray-300" />
                <p className="font-bold text-gray-700">No products ordered yet</p>
                <p className="text-gray-400">Switch to "All Items" tab to add products to your order.</p>
                <button
                  onClick={() => setFilterTab('all')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  View All Products
                </button>
              </div>
            ) : filterTab === 'favorites' ? (
              <div className="space-y-2">
                <Star className="w-8 h-8 mx-auto text-amber-300 fill-amber-300" />
                <p className="font-bold text-gray-700">No favorite products</p>
                <p className="text-gray-400">Star any product in "All Items" to see it here.</p>
              </div>
            ) : (
              'No products found matching filters.'
            )}
          </div>
        ) : (
          data.map(item => {
            const itemId = item.id || item._id;
            const currentQty = Number(item[activeStaffId] || 0);
            const isFav = favorites.includes(itemId);
            const itemCuft = item.cuft || 0;
            const subtotalCuft = (currentQty * itemCuft).toFixed(2);

            return (
              <div 
                key={itemId}
                className={clsx(
                  "bg-white rounded-2xl p-4 border transition-all duration-150 shadow-xs relative",
                  currentQty > 0 
                    ? "border-indigo-400 ring-1 ring-indigo-400/20 bg-indigo-50/20" 
                    : "border-gray-200"
                )}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900 text-base">{item.model}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {item.company}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {item.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-600 font-medium">
                      <span>Volume: <strong>{itemCuft} cuft</strong></span>
                      {currentQty > 0 && (
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          Subtotal: {subtotalCuft} cuft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Favorite button */}
                  {user?.role === 'staff' && (
                    <button
                      onClick={() => toggleFavorite(itemId)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-amber-500 transition-colors"
                    >
                      <Star className={clsx("w-5 h-5", isFav ? "fill-amber-400 text-amber-500" : "text-gray-300")} />
                    </button>
                  )}
                </div>

                {/* Stepper Quantity Control */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    {activeStaffMember?.name ? `${activeStaffMember.name}'s Quantity:` : 'Order Qty:'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStepperChange(itemId, -1)}
                      disabled={currentQty <= 0}
                      className="w-8 h-8 rounded-lg bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 font-bold transition-colors"
                      title="Decrease by 1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={currentQty === 0 ? '' : currentQty}
                      placeholder="0"
                      onChange={(e) => handleDirectInputChange(itemId, e.target.value)}
                      className={clsx(
                        "w-14 h-8 text-center text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500",
                        currentQty > 0 
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" 
                          : "bg-white text-gray-700 border-gray-200"
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => handleStepperChange(itemId, 1)}
                      className="w-8 h-8 rounded-lg bg-indigo-50 active:bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold transition-colors border border-indigo-100"
                      title="Increase by 1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP & FULL TABLE VIEW */}
      <div className={clsx(
        "bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0",
        mobileViewMode === 'cards' && "hidden md:flex"
      )}>
        <div className="overflow-x-auto flex-1 relative w-full">
          <table className="min-w-[800px] md:min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-20 shadow-xs">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <th 
                      key={header.id} 
                      className={
                        index === 0 
                          ? "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-30 border-b border-gray-200" 
                          : "px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200"
                      }
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell, index) => {
                    const currentUserId = user?.id?.toString() || user?._id?.toString();
                    const isStaffCol = cell.column.id?.toString() === currentUserId;
                    return (
                      <td 
                        key={cell.id} 
                        className={
                          index === 0 
                            ? "px-4 py-3 whitespace-nowrap text-sm text-left sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100 font-medium" 
                            : index === 2 
                            ? "px-4 py-3 whitespace-nowrap text-sm text-center bg-indigo-50/40" 
                            : `px-4 py-3 whitespace-nowrap text-sm text-center border-l border-gray-50 ${isStaffCol ? 'bg-amber-50/40' : ''}`
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 text-xs">
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR FOR MOBILE (Zero Scrolling Needed to Submit) */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="truncate">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">
            {activeStaffMember?.name || user?.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-extrabold text-indigo-700">
              {myTotalQty} pcs
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-semibold text-gray-600">
              {myTotalCuft} cuft
            </span>
          </div>
        </div>

        {user?.role === 'staff' ? (
          <button
            onClick={handleSubmitOrders}
            disabled={submitting || myTotalQty === 0}
            className="px-4 py-2 bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 flex-shrink-0"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                Submit Orders
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

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

export default Dashboard;
