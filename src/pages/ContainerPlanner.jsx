import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Container, ArrowRight, Plus, X, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { AlertModal } from '../components/ui/AlertModal';

export const ContainerPlanner = () => {
  const [containersList, setContainersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  
  const [selectedItems, setSelectedItems] = useState({});
  const [targetContainerId, setTargetContainerId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerCapacity, setNewContainerCapacity] = useState('2400');
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [containers, matrix, products] = await Promise.all([
        api.getContainers(),
        api.getOrderMatrix(),
        api.getProducts()
      ]);

      setContainersList(containers || []);
      setMatrixData(matrix?.matrix || []);
      setProductsList(products || []);

      if (containers?.length > 0 && !targetContainerId) {
        setTargetContainerId(containers[0].id || containers[0]._id);
      }
    } catch (err) {
      console.warn('Load planner failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Calculate unassigned items from live data
  const unassignedItems = useMemo(() => {
    // 1. Total ordered per product
    const productOrderedMap = {};
    matrixData.forEach(row => {
      productOrderedMap[row.id] = row.total || 0;
    });

    // 2. Total already loaded in all containers
    const productAssignedMap = {};
    containersList.forEach(c => {
      (c.loadedProducts || []).forEach(lp => {
        const pId = lp.productId || lp.product_id;
        productAssignedMap[pId] = (productAssignedMap[pId] || 0) + Number(lp.quantity || 0);
      });
    });

    // 3. Unassigned list
    return productsList.map(prod => {
      const prodId = prod.id || prod._id;
      const totalOrdered = productOrderedMap[prodId] || 0;
      const totalAssigned = productAssignedMap[prodId] || 0;
      const remaining = Math.max(0, totalOrdered - totalAssigned);

      if (remaining > 0) {
        return {
          ...prod,
          id: prodId,
          remainingQty: remaining,
          remainingCuft: Number((remaining * (prod.cuft || 0)).toFixed(2))
        };
      }
      return null;
    }).filter(Boolean);
  }, [productsList, matrixData, containersList]);

  const handleSelectItem = (productId, remainingQty, checked) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (checked) {
        newItems[productId] = remainingQty;
      } else {
        delete newItems[productId];
      }
      return newItems;
    });
  };

  const handleAssign = async () => {
    if (!targetContainerId || Object.keys(selectedItems).length === 0) return;
    setAssignLoading(true);

    const assignments = Object.keys(selectedItems).map(id => ({
      productId: id,
      quantity: Number(selectedItems[id])
    }));

    try {
      await api.assignProductsToContainer(targetContainerId, assignments);
      setAlertConfig({
        isOpen: true,
        title: 'Assigned Successfully',
        message: `${assignments.length} product(s) assigned to container. Space recalculated automatically.`,
        type: 'success'
      });
      setSelectedItems({});
      loadAll();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to assign products.',
        type: 'danger'
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAddContainer = async (e) => {
    e.preventDefault();
    if (!newContainerName) return;

    try {
      const res = await api.createContainer({
        name: newContainerName,
        capacity_cuft: Number(newContainerCapacity) || 2400
      });

      setAlertConfig({
        isOpen: true,
        title: 'Container Created',
        message: `${newContainerName} ready for planning.`,
        type: 'success'
      });

      setNewContainerName('');
      setNewContainerCapacity('2400');
      setShowModal(false);
      loadAll();
      if (res?.id) setTargetContainerId(res.id);
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to create container.',
        type: 'danger'
      });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Container Planner</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Manual assignment of ordered products to shipping containers with live Cubic Feet (Cuft) capacity tracking.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={loadAll}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm flex items-center shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 shadow-md flex items-center transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Container
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[460px]">
        {/* Unassigned Items */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center rounded-t-xl">
            <h2 className="font-semibold text-gray-900 text-sm">Unassigned Ordered Items</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {unassignedItems.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {unassignedItems.map(item => (
              <div 
                key={item.id} 
                className={`border rounded-xl p-3 transition-colors cursor-pointer ${
                  selectedItems[item.id] ? 'border-indigo-500 bg-indigo-50/40 shadow-sm' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 w-4 h-4" 
                      checked={!!selectedItems[item.id]}
                      onChange={(e) => handleSelectItem(item.id, item.remainingQty, e.target.checked)}
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.model}</p>
                      <p className="text-xs text-gray-500 font-medium">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {item.remainingQty} <span className="text-xs text-gray-400 font-normal">pcs</span>
                    </p>
                    <p className="text-xs font-semibold text-indigo-600">
                      {item.remainingCuft} cuft
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {unassignedItems.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All ordered items are fully assigned!
              </div>
            )}
          </div>
        </div>

        {/* Action Column */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
            Assign To
          </label>
          <select 
            className="bg-white border border-gray-300 text-gray-900 text-xs font-semibold rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 shadow-sm w-28"
            value={targetContainerId}
            onChange={(e) => setTargetContainerId(e.target.value)}
          >
            {containersList.map(c => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
            ))}
          </select>

          <button 
            onClick={handleAssign}
            disabled={Object.keys(selectedItems).length === 0 || assignLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              Object.keys(selectedItems).length > 0 
                ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 cursor-pointer transform hover:scale-105' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {assignLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Containers List */}
        <div className="lg:col-span-7 space-y-4 overflow-y-auto">
          {containersList.map(container => {
            const containerId = container.id || container._id;
            const isTarget = targetContainerId === containerId;
            const capacity = Number(container.capacity_cuft || container.capacityCuft || 2400);
            const usedCuft = Number(container.used_cuft || container.usedCuft || 0);
            const remainingCuft = Number(Math.max(0, capacity - usedCuft).toFixed(2));
            const progressPct = Math.min((usedCuft / capacity) * 100, 100);

            return (
              <div 
                key={containerId} 
                className={`bg-white rounded-xl shadow-sm border transition-all ${
                  isTarget ? 'border-indigo-400 ring-2 ring-indigo-400/20' : 'border-gray-200'
                }`}
              >
                <div className={`p-5 border-b border-gray-100 rounded-t-xl ${isTarget ? 'bg-indigo-50/40' : 'bg-gray-50/50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Container className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-bold text-gray-900 text-base">{container.name}</h2>
                        {isTarget && (
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                            Target
                          </span>
                        )}
                        <span className="text-xs uppercase font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                          {container.status || 'draft'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Capacity: {capacity} cuft | Used: {usedCuft} cuft</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Remaining Space</p>
                      <p className={`text-lg font-bold ${remainingCuft < 100 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {remainingCuft} <span className="text-xs font-medium">cuft</span>
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${progressPct > 90 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {(container.loadedProducts || []).map((lp, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{lp.model || 'Product'}</p>
                        <p className="text-gray-500">{lp.description}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-gray-800">{lp.quantity} pcs</span>
                        <span className="text-gray-400 ml-2">({lp.totalCuft || 0} cuft)</span>
                      </div>
                    </div>
                  ))}

                  {(!container.loadedProducts || container.loadedProducts.length === 0) && (
                    <div className="text-center py-6 text-gray-400 text-xs">
                      No products assigned to this container yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Add Container */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Container</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddContainer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Container Name</label>
                <input 
                  type="text" 
                  required
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                  placeholder="e.g. Container 4 (August Batch)" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity (Cuft)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={newContainerCapacity}
                  onChange={(e) => setNewContainerCapacity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                  placeholder="2400" 
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md">Create Container</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
