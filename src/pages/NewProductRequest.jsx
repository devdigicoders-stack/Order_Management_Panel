import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, Info, Loader2 } from 'lucide-react';
import { AlertModal } from '../components/ui/AlertModal';
import api from '../services/api';

const requestSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  model: z.string().min(1, 'Model number is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional()
});

export const NewProductRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: { quantity: 1 }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.requestNewProduct(data);
      setAlertConfig({
        isOpen: true,
        title: "Request Submitted",
        message: `${data.model} has been submitted for admin approval! Once approved with Cuft, it will be added to the master catalog.`,
        type: "success"
      });
      setTimeout(() => {
        navigate('/staff/dashboard');
      }, 1800);
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to submit product request.",
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <h1 className="text-xl font-bold text-white">Request New Product</h1>
        <p className="text-indigo-100 text-sm mt-1 opacity-90">
          Cannot find a product in the catalog? Enter its details here to submit it for admin approval.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start">
        <Info className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-amber-900">Admin Review & Approval Required</h3>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            The item will appear in your pending items. Once the admin reviews it and adds the Cubic Feet (Cuft), the product will be saved permanently into the master catalog.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Supplier <span className="text-red-500">*</span></label>
              <input 
                {...register('company')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                placeholder="e.g. PREMIER, MIDEA"
              />
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Model Number <span className="text-red-500">*</span></label>
              <input 
                {...register('model')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
                placeholder="e.g. MW-6647"
              />
              {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Product Description <span className="text-red-500">*</span></label>
            <input 
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Microwave 0.7 Cuft 700W"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Order Quantity <span className="text-red-500">*</span></label>
            <input 
              type="number"
              min="1"
              {...register('quantity', { valueAsNumber: true })}
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Notes (Optional)</label>
            <textarea 
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Any specific customer requirements, dimensions, or links..."
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="w-full md:w-auto justify-center bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md flex items-center transition-transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackagePlus className="w-4 h-4 mr-2" />}
              Submit Request for Approval
            </button>
          </div>
        </form>
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
