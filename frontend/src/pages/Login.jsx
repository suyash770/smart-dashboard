import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Lock, LogIn, Loader2, Activity } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Please write correct email id');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            console.log("Login successful, API response:", res.data);
            login(res.data);
            console.log("Navigating to dashboard...");
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
            {/* Background gradient */}
            <div className="fixed inset-0 bg-dark-900">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">SmartDash</h1>
                </div>

                {/* Card */}
                <div className="glass-card rounded-2xl p-8">
                    <h2 className="text-xl font-bold text-white text-center mb-1">Welcome back</h2>
                    <p className="text-sm text-slate-400 text-center mb-6">Sign in to your dashboard</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5
                                    text-sm text-white placeholder-slate-600
                                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                                    transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••" required
                                    className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5
                                    text-sm text-white placeholder-slate-600
                                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                                    transition-all duration-200"
                                />
                            </div>
                            <div className="flex justify-end mt-1">
                                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="flex items-center justify-center gap-2 w-full py-2.5 mt-2
                            bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg
                            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                            shadow-lg shadow-indigo-600/20 cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
