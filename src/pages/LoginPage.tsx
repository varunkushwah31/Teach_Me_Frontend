import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../services/api';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = isRegister ? apiRegister : apiLogin;
      const { token } = await fn(email, password);
      login(token);
      navigate('/chat');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const renderButtonIcon = () => {
    if (loading) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (isRegister) return <UserPlus className="w-5 h-5" />;
    return <LogIn className="w-5 h-5" />;
  };

  const renderButtonText = () => {
    if (loading) return 'Please wait...';
    if (isRegister) return 'Create Account';
    return 'Sign In';
  };

  return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#5b4fff]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#968fff]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-[#5b4fff] to-[#968fff] mb-4 shadow-lg shadow-[#5b4fff]/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">TeachMe</h1>
            <p className="text-zinc-400 mt-2">AI-Powered Document Intelligence</p>
          </div>

          <div className="bg-[#111111]/85 backdrop-blur-2xl border border-zinc-800/60 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white tracking-tight mb-6">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>

            {error && (
                <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email-input" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Email
                </label>
                <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#1a1a1a]/40 border border-zinc-800/80 text-zinc-100 rounded-xl px-4 py-3 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#5b4fff] focus:border-[#5b4fff] transition-all"
                />
              </div>
              <div>
                <label htmlFor="password-input" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <input
                    id="password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1a1a1a]/40 border border-zinc-800/80 text-zinc-100 rounded-xl px-4 py-3 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#5b4fff] focus:border-[#5b4fff] transition-all"
                />
              </div>
              <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5b4fff]/20"
              >
                {renderButtonIcon()}
                {renderButtonText()}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  className="text-sm text-zinc-400 hover:text-[#968fff] transition-colors"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default LoginPage;