import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFail } from '../store/store';
import axios from 'axios';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login({ setPage }) {
  const [email, setEmail] = useState('user@grocery.com');
  const [password, setPassword] = useState('user123');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        dispatch(authSuccess({ user: res.data.user, token: res.data.token }));
        setPage('catalog');
      }
    } catch (err) {
      dispatch(authFail(err.response?.data?.message || 'Invalid Credentials'));
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setEmail('admin@grocery.com');
      setPassword('admin123');
    } else {
      setEmail('user@grocery.com');
      setPassword('user123');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center px-4 relative">
      <div class="absolute w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl -top-10 -left-10 animate-pulse"></div>
      <div class="absolute w-80 h-80 rounded-full bg-violet-500/10 blur-3xl -bottom-10 -right-10 animate-pulse"></div>

      <div class="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10 border border-white/10 shadow-2xl">
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 justify-center mb-3">
            <span class="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-violet-500 text-white shadow-md">
              <ShieldCheck class="w-6 h-6" />
            </span>
            <div class="text-left">
              <span class="font-extrabold text-2xl tracking-tight text-white block">
                Zippy<span class="text-emerald-400">Mart</span>
              </span>
              <span class="text-[9px] font-black text-violet-400 tracking-widest uppercase block -mt-0.5">AI Grocery Platform</span>
            </div>
          </div>
          <h2 class="text-xl font-bold text-gray-200 mt-2">
            Welcome back!
          </h2>
          <p class="text-gray-400 text-sm mt-1">Sign in to experience AI Grocery Intelligence</p>
        </div>

        {error && (
          <div class="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} class="space-y-5">
          <div>
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email Address</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                class="w-full pl-12 pr-4 py-3.5 bg-darkBg/60 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                class="w-full pl-12 pr-4 py-3.5 bg-darkBg/60 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight class="w-5 h-5" />
          </button>
        </form>

        <div class="mt-6 flex flex-col gap-2.5">
          <span class="text-xs text-gray-400 text-center font-medium">Quick Sandbox Access:</span>
          <div class="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickLogin('user')}
              class="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/20 text-gray-300 text-xs font-semibold rounded-xl transition-all"
            >
              🔑 Test User
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              class="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/20 text-gray-300 text-xs font-semibold rounded-xl transition-all"
            >
              👑 Test Admin
            </button>
          </div>
        </div>

        <p class="mt-6 text-center text-sm text-gray-400">
          New to the platform?{' '}
          <button onClick={() => setPage('register')} class="text-emerald-400 hover:underline font-semibold transition-all">
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
}
