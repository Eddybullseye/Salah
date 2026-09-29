'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Check, AlertCircle, LogOut } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onUserChanged }) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser(data.user);
          setDisplayName(data.user.user_metadata?.full_name || '');
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const supabase = getSupabase();
    if (!supabase) {
      setStatus('Please configure your Supabase Project URL in Settings first.');
      return;
    }

    setIsLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: {
          full_name: displayName.trim() || undefined,
        },
      },
    });

    setIsLoading(false);
    if (error) {
      setStatus(`Error: ${error.message}`);
    } else {
      setStatus('✓ Magic link sent! Please check your email inbox to log in.');
    }
  };

  const handleGoogleSignIn = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus('Please configure your Supabase Project URL in Settings first.');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) {
      setStatus(`Google Sign-In Error: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    onUserChanged?.(null);
    setStatus('Signed out. Continuing in Guest mode.');
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-emerald-950 via-teal-950 to-emerald-950 border border-amber-500/40 p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-2">
            <User className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold">
            {currentUser ? 'Your Salah Account' : 'Sign in to Sync'}
          </h3>
          <p className="text-xs text-emerald-200/70 mt-1">
            {currentUser
              ? 'Your prayers, streaks, and bookmarks sync securely across all your devices.'
              : 'Save streaks, prayer logs, and custom push subscriptions across devices.'}
          </p>
        </div>

        {status && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{status}</span>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-900/40 border border-emerald-800/50 space-y-1">
              <span className="text-[11px] text-emerald-300/70 uppercase font-semibold">
                Signed In As:
              </span>
              <p className="text-sm font-semibold text-white truncate">{currentUser.email}</p>
              {currentUser.user_metadata?.full_name && (
                <p className="text-xs text-amber-300">
                  {currentUser.user_metadata.full_name}
                </p>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-emerald-900/80 hover:bg-rose-950 text-rose-300 font-semibold border border-rose-800/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleMagicLink} className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-200 font-semibold mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Tariq"
                  className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-emerald-200 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-800 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>{isLoading ? 'Sending...' : 'Send Magic Sign-In Link'}</span>
              </button>
            </form>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-emerald-800/60 w-full" />
              <span className="bg-emerald-950 px-2 text-[10px] text-emerald-400 uppercase font-semibold">
                or
              </span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-white font-semibold text-xs border border-emerald-700/50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-center text-xs text-emerald-300 hover:text-white"
            >
              Continue as Guest (Offline Mode)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
