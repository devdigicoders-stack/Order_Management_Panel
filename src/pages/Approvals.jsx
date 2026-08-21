import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertCircle, Check, X, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertModal } from '../components/ui/AlertModal';

const approvalSchema = z.object({
  model: z.string(),
  company: z.string(),
  description: z.string(),
  cuft: z.number().min(0.01, 'Cubic feet is required and must be greater than 0'),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export const Approvals = () => {
  const pendingProducts = useStore(state => state.pendingProducts);
  const fetchPendingProducts = useStore(state => state.fetchPendingProducts);
  const approveProduct = useStore(state => state.approveProduct);
  const rejectProduct = useStore(state => state.rejectProduct);

  const [selectedPending, setSelectedPending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(approvalSchema)
  });

  const loadPending = async () => {
    setLoading(true);
    try {
      await fetchPendingProducts();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleSelectPending = (item) => {
    setSelectedPending(item);
    setValue('model', item.model);
    setValue('company', item.company);
    setValue('description', item.description);
    setValue('cuft', item.cuft || 0);
    setValue('category', item.category === 'Pending Review' ? 'Kitchen' : (item.category || ''));
    setValue('notes', item.notes || '');
  };

  const handleReject = async () => {
    if (!selectedPending) return;
    setActionLoading(true);
    try {
      const targetId = selectedPending.id || selectedPending._id;
      await rejectProduct(targetId, 'Not approved by admin');
      setAlertConfig({
        isOpen: true,
        title: 'Product Rejected',
        message: `${selectedPending.model} has been rejected.`,
        type: 'info'
      });
      setSelectedPending(null);
      reset();
      loadPending();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to reject product.',
        type: 'danger'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedPending) return;
    setActionLoading(true);
    try {
      const targetId = selectedPending.id || selectedPending._id;
      await approveProduct(targetId, data);
      setAlertConfig({
        isOpen: true,
        title: 'Product Approved',
        message: `${data.model} successfully approved and added to master product database!`,
        type: 'success'
      });
      setSelectedPending(null);
      reset();
      loadPending();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to approve product.',
        type: 'danger'
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col mb-24 lg:mb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <h1 className="text-xl font-bold text-white">Unknown Item Approvals</h1>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Review new products requested by sales staff, assign Cubic Feet (Cuft), and approve to master catalog.
          </p>
        </div>
        <button
          onClick={loadPending}
          className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm flex items-center shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[460px]">
        {/* Pending List */}
        <div className={`lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col ${selectedPending ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center rounded-t-xl">
            <h2 className="font-semibold text-gray-900">Pending Requests</h2>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
              {pendingProducts.length}
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {loading && pendingProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading pending items...
              </div>
            ) : pendingProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm bg-white rounded-xl border border-dashed border-gray-200">
                <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                No pending products to approve.
              </div>
            ) : (
              pendingProducts.map(item => {
                const itemId = item.id || item._id;
                const isSelected = (selectedPending?.id || selectedPending?._id) === itemId;
                return (
                  <div 
                    key={itemId} 
                    onClick={() => handleSelectPending(item)}
                    className={`p-4 cursor-pointer transition-all rounded-xl border ${
                      isSelected 
                        ? 'bg-amber-50/50 border-amber-400 shadow-sm ring-1 ring-amber-400' 
                        : 'bg-white border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center text-amber-600">
                        <div className="p-1.5 rounded-lg mr-2 bg-amber-100">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{item.model}</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.company}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 pl-8 font-medium">{item.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 pl-8">
                      <span className="font-semibold text-gray-700">
                        By: {item.requested_by_name || item.requestedBy?.name || item.staffName || 'Staff'}
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                        Qty: <span className="font-bold text-gray-800">{item.requested_qty || item.qty || 1}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Approval Form */}
        <div className={`lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col ${!selectedPending ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
            {selectedPending && (
              <button 
                type="button" 
                onClick={() => setSelectedPending(null)} 
                className="mr-3 lg:hidden text-gray-500 bg-gray-100 p-1.5 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">Review, Add Cuft & Approve</h2>
          </div>
          
          {selectedPending ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Model Number</label>
                  <input {...register('model')} type="text" className="w-full border border-gray-300 rounded-lg text-sm p-2 bg-gray-50 font-mono" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Supplier</label>
                  <input {...register('company')} type="text" className="w-full border border-gray-300 rounded-lg text-sm p-2 bg-gray-50 font-mono" readOnly />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Description</label>
                <input {...register('description')} type="text" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cubic Feet (Cuft) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register('cuft', { valueAsNumber: true })} 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 0.85" 
                    className="w-full border border-indigo-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50/30 font-bold text-indigo-900" 
                  />
                  {errors.cuft && <p className="text-red-500 text-xs mt-1">{errors.cuft.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category (Optional)</label>
                  <input {...register('category')} type="text" placeholder="Kitchen, Cooling..." className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <textarea {...register('notes')} rows={3} placeholder="Additional specifications..." className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
              </div>

              <div className="pt-5 flex justify-end gap-3 border-t border-gray-100 mt-auto">
                <button 
                  type="button" 
                  onClick={handleReject} 
                  disabled={actionLoading}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-1.5" /> Reject
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-md flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                  Approve to Master Database
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-gray-600 font-medium text-sm">Select a pending product request from the list to review and assign Cuft.</p>
            </div>
          )}
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
