import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from '@tanstack/react-table';
import { Truck, Save, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import api from '../services/api';

const EditableDistCell = ({ getValue, row, column, table }) => {
  const initialValue = getValue() || 0;
  const [value, setValue] = useState(initialValue);
  const updateDistributionCell = useStore(state => state.updateDistributionCell);
  
  const staffId = column.id;
  const staffOrdered = row.original.staffOrdered?.[staffId] || 0;
  const staffPending = Math.max(0, staffOrdered - (Number(value) || 0));

  const onBlur = () => {
    const containerId = table.options.meta?.containerId;
    const productId = row.original.productId;
    if (Number(value) !== Number(initialValue)) {
      updateDistributionCell(containerId, productId, staffId, Number(value) || 0);
      table.options.meta?.refresh();
    }
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  if (staffOrdered === 0) {
    return <span className="text-gray-300">-</span>;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <span className="text-[10px] text-gray-400 mb-0.5 leading-none">
        Ord: <span className="font-semibold text-gray-700">{staffOrdered}</span>
      </span>
      <input
        type="number"
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={e => setValue(e.target.value === '' ? 0 : Number(e.target.value))}
        onBlur={onBlur}
        className="w-16 border border-gray-300 rounded text-center text-xs font-semibold py-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
        min="0"
      />
      <span className={`text-[10px] mt-0.5 font-semibold ${staffPending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
        Pend: {staffPending}
      </span>
    </div>
  );
};

export const ContainerDistribution = () => {
  const [containersList, setContainersList] = useState([]);
  const [selectedContainerId, setSelectedContainerId] = useState('');
  const [matrixData, setMatrixData] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const loadContainers = async () => {
    try {
      const data = await api.getContainers();
      setContainersList(data || []);
      if (data?.length > 0 && !selectedContainerId) {
        setSelectedContainerId(data[0].id || data[0]._id);
      }
    } catch (err) {
      console.warn('Failed to load containers:', err.message);
    }
  };

  const loadMatrix = async () => {
    if (!selectedContainerId) return;
    setLoading(true);
    try {
      const data = await api.getDistributionMatrix(selectedContainerId);
      setMatrixData(data?.matrix || []);
      setStaffList(data?.staff || []);
    } catch (err) {
      console.warn('Failed to load distribution matrix:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContainers();
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [selectedContainerId]);

  const data = useMemo(() => {
    return matrixData.map(item => {
      const row = {
        productId: item.productId,
        model: item.model,
        description: item.description,
        company: item.company,
        containerReceivedQty: item.containerReceivedQty,
        totalOrdered: item.totalOrdered,
        totalDistributed: item.totalDistributed,
        remainingToDistribute: item.remainingToDistribute,
        staffOrdered: item.staffOrdered || {},
        staffPending: item.staffPending || {}
      };

      (staffList || []).forEach(s => {
        const staffKey = s.id?.toString() || s._id?.toString();
        row[staffKey] = item.staffDistributed?.[staffKey] || 0;
      });

      return row;
    });
  }, [matrixData, staffList]);

  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: 'model',
        header: 'Product',
        cell: info => (
          <div>
            <span className="font-bold text-gray-900 block">{info.getValue()}</span>
            <span className="text-xs text-gray-500 truncate block w-36">{info.row.original.description}</span>
          </div>
        ),
      },
      {
        accessorKey: 'containerReceivedQty',
        header: 'Container Qty',
        cell: info => <span className="font-bold text-emerald-600">{info.getValue() || 0}</span>,
      },
      {
        accessorKey: 'totalOrdered',
        header: 'Total Ordered',
        cell: info => <span className="font-bold text-indigo-600">{info.getValue() || 0}</span>,
      }
    ];

    (staffList || []).forEach(s => {
      const staffKey = s.id?.toString() || s._id?.toString();
      cols.push({
        accessorKey: staffKey,
        header: s.name,
        cell: EditableDistCell,
      });
    });

    cols.push({
      accessorKey: 'totalDistributed',
      header: 'Total Dist',
      cell: info => <span className="font-bold text-indigo-700">{info.getValue() || 0}</span>,
    });
    
    cols.push({
      accessorKey: 'remainingToDistribute',
      header: 'Remaining in Cont.',
      cell: info => {
        const val = info.getValue() || 0;
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            val === 0 ? 'bg-emerald-100 text-emerald-800' : val < 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {val}
          </span>
        );
      }
    });

    return cols;
  }, [staffList]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      containerId: selectedContainerId,
      refresh: loadMatrix
    }
  });

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 h-full flex flex-col max-w-7xl mx-auto mb-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Container Distribution</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Allocate received container shipment quantities among salespersons. Pending quantities calculate automatically.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
          {isSaved && (
            <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center shadow-sm">
              <CheckCircle className="w-4 h-4 mr-1.5" /> Changes saved live
            </span>
          )}

          <select 
            value={selectedContainerId}
            onChange={(e) => setSelectedContainerId(e.target.value)}
            className="w-full sm:w-auto border border-transparent rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-white bg-white/10 text-white [&>option]:text-gray-900 focus:outline-none"
          >
            {containersList.map(c => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
            ))}
          </select>

          <button 
            onClick={loadMatrix}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
            title="Refresh distribution"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Editable Allocation Matrix</h2>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            Formula: <span className="font-bold text-indigo-600">Pending = Ordered − Distributed</span>
          </span>
        </div>

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
                          : "px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200"
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
                  {row.getVisibleCells().map((cell, index) => (
                    <td 
                      key={cell.id} 
                      className={
                        index === 0 
                          ? "px-4 py-3 whitespace-nowrap text-sm text-left sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100" 
                          : "px-2 py-2 whitespace-nowrap text-sm text-center border-l border-gray-100"
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                    {loading ? 'Loading container distribution...' : 'No products found for this container.'}
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
