import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, CheckCircle, Mail, Settings, Phone, Loader2 } from 'lucide-react';
import { AlertModal } from '../components/ui/AlertModal';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const Profile = () => {
  const user = useStore(state => state.user);
  const updateUserPassword = useStore(state => state.updateUserPassword);
  const updateUserProfile = useStore(state => state.updateUserProfile);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const onSubmitPassword = async (data) => {
    setPasswordLoading(true);
    try {
      await updateUserPassword(data.newPassword);
      setIsSaved(true);
      reset();
      setTimeout(() => setIsSaved(false), 3000);
      setAlertConfig({
        isOpen: true,
        title: "Success",
        message: "Password updated successfully!",
        type: "success"
      });
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to update password.",
        type: "danger"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateUserProfile(profileData.name, profileData.email, profileData.phone);
      setIsProfileSaved(true);
      setTimeout(() => setIsProfileSaved(false), 3000);
      setAlertConfig({
        isOpen: true,
        title: "Profile Updated",
        message: "Account profile details saved successfully.",
        type: "success"
      });
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to update profile.",
        type: "danger"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col mb-10">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white">
        <h1 className="text-xl font-bold text-white">My Account Profile</h1>
        <p className="text-indigo-100 text-sm mt-1 opacity-90">Manage your profile details, contact information, and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* User Info Card */}
        <div className="lg:col-span-4 space-y-6 h-fit">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3 border border-indigo-100 font-bold text-2xl">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <h2 className="text-base font-bold text-gray-900">{user?.name}</h2>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-0.5">{user?.role} Role</p>
            
            <div className="w-full h-px bg-gray-100 my-4"></div>
            
            <div className="space-y-2 text-xs text-gray-600 w-full text-left">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span>{user?.phone || '+1234567890'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings & Password */}
        <div className="lg:col-span-8 space-y-6">
          {/* Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" 
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={profileLoading}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md flex items-center transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {profileLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Change Password</h3>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitPassword)} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                  <input 
                    {...register('newPassword')} 
                    type="password" 
                    className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="At least 6 characters"
                  />
                  {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    {...register('confirmPassword')} 
                    type="password" 
                    className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="Confirm new password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md flex items-center transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {passwordLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
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
