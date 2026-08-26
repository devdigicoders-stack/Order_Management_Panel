import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';
import { Filter, Download, Search, RefreshCw, Loader2, Star } from 'lucide-react';
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

  // Only the staff member this column belongs to can edit
  const currentUserId = table.options.meta?.userId?.toString();
  const columnStaffId = column.id?.toString();
  const isEditable = table.options.meta?.userRole === 'staff' && currentUserId === columnStaffId;

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

  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [companies, setCompanies] = useState(['All', 'PREMIER', 'MIDEA', 'SAMSUNG', 'SONY']);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

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

  // Compute Matrix Data
  const data = useMemo(() => {
    let list = orderMatrix || [];
    if (showFavoritesOnly) {
      list = list.filter(r => favorites.includes(r.id || r._id));
    }
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(r => 
        (r.model && r.model.toLowerCase().includes(q)) || 
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [orderMatrix, globalFilter, showFavoritesOnly, favorites]);

  // Define Columns dynamically based on Staff
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

  const [submitting, setSubmitting] = useState(false);

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
    if (!data.length) return;
    const headers = ['Model', 'Description', 'Company', 'Total', ...(staff || []).map(s => s.name)];
    const rows = data.map(r => [
      r.model,
      `"${r.description.replace(/"/g, '""')}"`,
      r.company,
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
    <div className="space-y-6 h-full flex flex-col mb-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Orders Matrix Dashboard</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            {user?.role === 'staff' 
              ? 'Enter your order quantities directly into your column in the Excel grid below.' 
              : 'Live Excel-style view of all salesperson orders with automatic total recalculation.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full md:w-auto items-center">
          <div className="relative w-full md:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search model..." 
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-transparent rounded-lg text-sm bg-white/10 text-white placeholder-indigo-200 focus:bg-white focus:text-gray-900 focus:outline-none shadow-sm"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="flex-1 md:flex-none border border-transparent rounded-lg shadow-sm text-sm py-2 px-3 focus:ring-2 focus:ring-white bg-white/10 text-white [&>option]:text-gray-900 focus:outline-none"
            >
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {user?.role === 'staff' && (
              <button 
                type="button"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm",
                  showFavoritesOnly
                    ? "bg-amber-400 text-amber-950 shadow-amber-400/30"
                    : "bg-white/10 hover:bg-white/20 text-white"
                )}
                title="Show only favorited products"
              >
                <Star className={clsx("w-3.5 h-3.5", showFavoritesOnly ? "fill-amber-950 text-amber-950" : "fill-amber-400 text-amber-400")} />
                <span>Favorites</span>
              </button>
            )}

            <button 
              onClick={loadData}
              title="Refresh Data"
              className="bg-white/10 border border-transparent text-white p-2 rounded-lg hover:bg-white/20 flex items-center shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {user?.role === 'staff' ? (
            <button 
              onClick={handleSubmitOrders}
              disabled={submitting || loading}
              className="w-full md:w-auto justify-center bg-white text-indigo-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 shadow-md flex items-center transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" />
                  Submitting...
                </>
              ) : (
                'Submit Orders'
              )}
            </button>
          ) : (
            <button 
              onClick={handleExportCSV}
              className="w-full md:w-auto justify-center bg-white text-indigo-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 shadow-md flex items-center transition-transform hover:scale-105"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1 relative w-full">
          <table className="min-w-[800px] md:min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
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
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                    {showFavoritesOnly ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Star className="w-8 h-8 text-amber-400 fill-amber-400 mb-2" />
                        <p className="text-sm font-bold text-gray-800">No Favorite Products Starred</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                          You have filtered by favorites, but haven't starred any products yet. Click the star icon (☆) next to any model to add it to your favorites.
                        </p>
                        <button 
                          type="button"
                          onClick={() => setShowFavoritesOnly(false)} 
                          className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          Show All Products
                        </button>
                      </div>
                    ) : loading ? (
                      'Loading matrix from database...'
                    ) : (
                      'No products found.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
