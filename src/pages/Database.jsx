import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, X, Trash2, Pencil, RefreshCw, Loader2, PackageSearch } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AlertModal } from '../components/ui/AlertModal';
import api from '../services/api';

const productSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  model: z.string().min(1, 'Model is required'),
  description: z.string().min(1, 'Description is required'),
  cuft: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().min(0, 'Cubic feet must be positive').optional()
  ),
  category: z.string().optional(),
});

export const ProductDatabase = () => {
  const user = useStore(state => state.user);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, formState: { errors: errorsAdd } } = useForm({
    resolver: zodResolver(productSchema)
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm({
    resolver: zodResolver(productSchema)
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const data = await api.getProducts(params);
      setProductsList(data || []);
    } catch (err) {
      console.warn('Failed to load products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm]);

  const handleOpenEdit = (product) => {
    setProductToEdit(product);
    resetEdit({
      company: product.company || '',
      model: product.model || '',
      description: product.description || '',
      cuft: product.cuft !== undefined ? Number(product.cuft) : 0,
      category: product.category || 'General',
    });
  };

  const onAddSubmit = async (data) => {
    try {
      if (user?.role === 'admin') {
        await api.createProduct({
          ...data,
          cuft: Number(data.cuft || 0)
        });
        setAlertConfig({
          isOpen: true,
          title: "Product Added",
          message: `${data.model} successfully added to master catalog!`,
          type: "success"
        });
      } else {
        await api.requestNewProduct({
          ...data,
          quantity: 1
        });
        setAlertConfig({
          isOpen: true,
          title: "Request Submitted",
          message: `Product request for ${data.model} submitted for admin approval!`,
          type: "success"
        });
      }
      setShowAddModal(false);
      resetAdd();
      loadProducts();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to save product.",
        type: "danger"
      });
    }
  };

  const onEditSubmit = async (data) => {
    if (!productToEdit) return;
    try {
      const targetId = productToEdit.id || productToEdit._id;
      await api.updateProduct(targetId, {
        ...data,
        cuft: Number(data.cuft || 0)
      });
      setAlertConfig({
        isOpen: true,
        title: "Product Updated",
        message: `${data.model} has been updated successfully!`,
        type: "success"
      });
      setProductToEdit(null);
      resetEdit();
      loadProducts();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to update product.",
        type: "danger"
      });
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      const targetId = productToDelete.id || productToDelete._id;
      await api.deleteProduct(targetId);
      setAlertConfig({
        isOpen: true,
        title: "Deleted",
        message: "Product removed from master catalog.",
        type: "info"
      });
      setProductToDelete(null);
      loadProducts();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to delete product.",
        type: "danger"
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Master Product Database</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            {user?.role === 'admin' ? 'Manage global master product catalog and cubic feet specifications.' : 'Browse the master product catalog or request new items.'}
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={loadProducts}
            className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 shadow-md flex items-center transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-1.5" /> 
            {user?.role === 'admin' ? 'Add New Product' : 'Request Product'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-[440px]">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Search by model, description, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">Total: {productsList.length} products</span>
        </div>

        <div className="overflow-x-auto flex-1 relative w-full">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Model</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Description</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Company</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Category</th>
                <th className="px-6 py-3 text-right font-bold text-gray-600 uppercase">Cubic Feet (Cuft)</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-right font-bold text-gray-600 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productsList.map((product) => (
                <tr key={product.id || product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">{product.model}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-600">{product.description}</td>
                  <td className="px-6 py-3 whitespace-nowrap font-semibold text-indigo-700">{product.company}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-500">{product.category || 'General'}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-right font-bold text-emerald-600">{(product.cuft || 0).toFixed(2)}</td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEdit(product)} 
                          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors p-1.5"
                          title="Edit product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setProductToDelete(product)} 
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors p-1.5"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {productsList.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'admin' ? "6" : "5"} className="px-6 py-12 text-center text-gray-400">
                    {loading ? 'Searching database...' : 'No products found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setShowAddModal(false)}>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {user?.role === 'admin' ? 'Add New Product to Master DB' : 'Request New Product'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Supplier</label>
                  <input {...registerAdd('company')} type="text" placeholder="PREMIER" className="w-full border border-gray-300 rounded-lg text-sm p-2 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  {errorsAdd.company && <p className="text-red-500 text-xs mt-1">{errorsAdd.company.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Model Number</label>
                  <input {...registerAdd('model')} type="text" placeholder="MW-6647" className="w-full border border-gray-300 rounded-lg text-sm p-2 uppercase font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  {errorsAdd.model && <p className="text-red-500 text-xs mt-1">{errorsAdd.model.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input {...registerAdd('description')} type="text" placeholder="Microwave 0.7 cuft" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                {errorsAdd.description && <p className="text-red-500 text-xs mt-1">{errorsAdd.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cubic Feet (Cuft)</label>
                    <input {...registerAdd('cuft', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.85" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-emerald-700" />
                    {errorsAdd.cuft && <p className="text-red-500 text-xs mt-1">{errorsAdd.cuft.message}</p>}
                  </div>
                )}
                <div className={user?.role === 'staff' ? "col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input {...registerAdd('category')} type="text" placeholder="Kitchen" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md">
                  {user?.role === 'admin' ? 'Save Product' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {productToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setProductToEdit(null)}>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit Product Details</h3>
                  <p className="text-xs text-gray-500 font-mono">{productToEdit.model}</p>
                </div>
              </div>
              <button onClick={() => setProductToEdit(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Supplier</label>
                  <input {...registerEdit('company')} type="text" placeholder="PREMIER" className="w-full border border-gray-300 rounded-lg text-sm p-2 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  {errorsEdit.company && <p className="text-red-500 text-xs mt-1">{errorsEdit.company.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Model Number</label>
                  <input {...registerEdit('model')} type="text" placeholder="MW-6647" className="w-full border border-gray-300 rounded-lg text-sm p-2 uppercase font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  {errorsEdit.model && <p className="text-red-500 text-xs mt-1">{errorsEdit.model.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input {...registerEdit('description')} type="text" placeholder="Microwave 0.7 cuft" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                {errorsEdit.description && <p className="text-red-500 text-xs mt-1">{errorsEdit.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cubic Feet (Cuft)</label>
                  <input {...registerEdit('cuft', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.85" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-emerald-700" />
                  {errorsEdit.cuft && <p className="text-red-500 text-xs mt-1">{errorsEdit.cuft.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input {...registerEdit('category')} type="text" placeholder="Kitchen" className="w-full border border-gray-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setProductToEdit(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete ${productToDelete?.model} from the master catalog?`}
        confirmText="Delete"
        type="danger"
      />

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
