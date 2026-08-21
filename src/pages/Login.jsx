import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PackageSearch, AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const Login = () => {
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });
  const navigate = useNavigate();
  const login = useStore(state => state.login);

  const onSubmit = async (data) => {
    setLoading(true);
    setAuthError(null);
    try {
      const user = await login(data.email, data.password);
      if (user?.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl shadow-gray-200/40 sm:rounded-3xl sm:px-12 border border-gray-100 flex flex-col items-center">
          
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md transform -rotate-3 mb-6">
            <PackageSearch className="w-8 h-8 text-white transform rotate-3" />
          </div>
          
          <h2 className="text-center text-xl font-bold text-gray-900 mb-1">
            Order Management System
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            Sign in to access your orders and dashboard
          </p>

          {authError && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form className="space-y-5 w-full" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all bg-gray-50 focus:bg-white"
                placeholder="admin@oms.com or ahmed@oms.com"
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                defaultValue="password123"
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign In
              </button>
            </div>
          </form>

          {/* Quick Demo logins helper */}
          <div className="mt-6 pt-6 border-t border-gray-100 w-full text-center">
            <p className="text-xs text-gray-400 mb-2 font-medium">Quick Demo Accounts:</p>
            <div className="flex justify-center gap-2 text-xs">
              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono">admin@oms.com</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">ahmed@oms.com</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
