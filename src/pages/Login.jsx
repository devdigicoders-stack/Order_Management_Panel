import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  PackageSearch, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Users, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const Login = () => {
  const [selectedRole, setSelectedRole] = useState('admin'); // 'admin' | 'staff'
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const navigate = useNavigate();
  const login = useStore(state => state.login);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setAuthError(null);
    reset({
      email: '',
      password: ''
    });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setAuthError(null);
    try {
      const user = await login(data.email, data.password, selectedRole);
      if (user?.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* App Logo & Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30 mb-3 transform hover:scale-105 transition-transform">
            <PackageSearch className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Order Management System
          </h1>
          <p className="text-sm text-indigo-200/80 mt-1">
            Enterprise Logistics & Pre-Order Management
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-white/40">
          
          {/* Top Role Switcher Segmented Control */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 text-center">
              Choose Login Role
            </label>
            <div className="grid grid-cols-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={clsx(
                  "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer",
                  selectedRole === 'admin'
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                )}
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('staff')}
                className={clsx(
                  "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer",
                  selectedRole === 'staff'
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                )}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Staff Login</span>
              </button>
            </div>

            {/* Selected Role Badge & Description */}
            <div className={clsx(
              "mt-3 p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all",
              selectedRole === 'admin' 
                ? "bg-indigo-50 border-indigo-200 text-indigo-800" 
                : "bg-blue-50 border-blue-200 text-blue-800"
            )}>
              <span className={clsx(
                "font-bold uppercase px-2 py-0.5 rounded-md text-[10px] tracking-wide text-white flex-shrink-0",
                selectedRole === 'admin' ? "bg-indigo-600" : "bg-blue-600"
              )}>
                {selectedRole === 'admin' ? 'Admin Portal' : 'Staff Portal'}
              </span>
              <span className="text-xs truncate">
                {selectedRole === 'admin'
                  ? 'Master controls, containers, analytics & catalog'
                  : 'Place pre-orders, view pending & received stock'}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Login Error</p>
                <p className="mt-0.5 text-red-600/90 leading-relaxed">{authError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={clsx(
                    "block w-full pl-10 pr-4 py-2.5 border rounded-xl shadow-sm text-gray-900 placeholder-gray-400 text-sm focus:outline-none transition-all",
                    errors.email 
                      ? "border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                      : "border-gray-200 bg-gray-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  )}
                  placeholder={selectedRole === 'admin' ? "Enter admin email" : "Enter staff email"}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={clsx(
                    "block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-sm text-gray-900 placeholder-gray-400 text-sm focus:outline-none transition-all",
                    errors.password 
                      ? "border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                      : "border-gray-200 bg-gray-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  )}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  "w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all transform active:scale-[0.98] disabled:opacity-70 cursor-pointer",
                  selectedRole === 'admin'
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-500/25"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/25"
                )}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In as {selectedRole === 'admin' ? 'Administrator' : 'Staff Member'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-indigo-200/60 mt-6">
          OMS Enterprise • Secure Role-Based Access Control
        </p>
      </div>
    </div>
  );
};
