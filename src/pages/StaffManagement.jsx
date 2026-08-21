import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, X, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AlertModal } from '../components/ui/AlertModal';
import api from '../services/api';

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().default('staff'),
});

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(staffSchema)
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const list = await api.getStaffList();
      setStaffList(list || []);
    } catch (err) {
      console.warn('Failed to load staff list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.createStaff({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'staff'
      });
      setAlertConfig({
        isOpen: true,
        title: "Staff Member Added",
        message: `${data.name} has been added successfully!`,
        type: "success"
      });
      setShowModal(false);
      reset();
      loadStaff();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to create staff member.",
        type: "danger"
      });
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const targetId = staffToDelete.id || staffToDelete._id;
      await api.request(`/staff/${targetId}`, { method: 'DELETE' });
      setAlertConfig({
        isOpen: true,
        title: "Removed",
        message: `${staffToDelete.name} has been removed.`,
        type: "info"
      });
      setStaffToDelete(null);
      loadStaff();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to delete staff member.",
        type: "danger"
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col mb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Staff Management</h1>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          </div>
          <p className="text-indigo-100 text-sm mt-1 opacity-90">
            Manage salesperson accounts, access credentials, and profile settings.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={loadStaff} 
            className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-white text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-50 shadow-md flex items-center transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-3">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Active Sales Personnel</h2>
          </div>
          <span className="text-xs text-gray-500 font-semibold">{staffList.length} Active Staff</span>
        </div>

        <div className="overflow-x-auto flex-1 relative w-full">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Name</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Role</th>
                <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase">Phone</th>
                <th className="px-6 py-3 text-right font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffList.map((staff) => (
                <tr key={staff.id || staff._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3 font-bold text-xs">
                        {staff.name?.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{staff.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-gray-600 font-mono">{staff.email}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 uppercase">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-gray-500">{staff.phone || '+1234567890'}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right">
                    <button 
                      onClick={() => setStaffToDelete(staff)} 
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Remove staff member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    {loading ? 'Loading staff...' : 'No staff members found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Add New Salesperson</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input {...register('name')} type="text" className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="e.g. Tariq Khan" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="e.g. tariq@oms.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <input {...register('password')} type="text" defaultValue="password123" className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={handleDeleteStaff}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${staffToDelete?.name}?`}
        confirmText="Remove"
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
