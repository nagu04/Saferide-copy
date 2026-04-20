import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShieldAlert, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/app/services/api';
import { showToast } from '@/app/utils/toast';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'user'>('admin');
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userRole) {
      if (userRole === 'admin') {
        navigate('/dashboard', { replace: true });
      } else if (userRole === 'user') {
        navigate('/user/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Store user role
      localStorage.setItem('userRole', userType);
      
      await api.auth.login({ username, password });
      
      // Show success toast
      showToast.success('Login Successful', `Welcome to SafeRide ${userType === 'admin' ? 'Admin' : 'User'} Portal`);
      
      // Navigate based on user type
      if (userType === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid credentials. Please try again.';
      setError(errorMessage);
      
      // Show error toast
      showToast.error('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-blue-600 p-3 rounded-xl mb-4"
          >
            <ShieldAlert className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-center">SafeRide Portal</h1>
          <p className="text-slate-400 text-center text-sm mt-1">REAL-TIME DETECTION SYSTEM</p>
        </div>

        {/* User Type Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 active:scale-95 ${
                userType === 'admin'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => setUserType('user')}
              className={`py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 active:scale-95 ${
                userType === 'user'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              User Login
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Username</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-blue-400" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-all duration-200 hover:border-slate-600"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-blue-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-all duration-200 hover:border-slate-600"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] hover:shadow-lg hover:shadow-blue-600/20"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
        </div>
      </motion.div>
    </div>
  );
}