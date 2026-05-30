import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFail } from '../store/store';
import axios from 'axios';
import { User, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';

export default function Register({ setPage }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleRegister = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      if (res.data.success) {
        dispatch(authSuccess({ user: res.data.user, token: res.data.token }));
        setPage('catalog');
      }
    } catch (err) {
      dispatch(authFail(err.response?.data?.message || 'Registration failed'));
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center px-4 relative">
      <div class="absolute w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl -top-10 -left-10 animate-pulse"></div>
      <div class="absolute w-80 h-80 rounded-full bg-violet-500/10 blur-3xl -bottom-10 -right-10 animate-pulse"></div>

      <div class="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10 border border-white/10 shadow-2xl">
        <div class="text-center mb-8">
          <div class="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
            <UserPlus class="w-8 h-8" />
          </div>
          <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">
            Get Started
          </h2>
          <p class="text-gray-400 text-sm mt-1">Create an account to order fresh items</p>
        </div>

        {error && (
          <div class="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} class="space-y-5">
          <div>
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Full Name</label>
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                class="w-full pl-12 pr-4 py-3.5 bg-darkBg/60 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                placeholder="Enter your name"
              />
            </div>
          </div>

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
                placeholder="Choose a password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Sign Up'}
            <ArrowRight class="w-5 h-5" />
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={() => setPage('login')} class="text-emerald-400 hover:underline font-semibold transition-all">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}
