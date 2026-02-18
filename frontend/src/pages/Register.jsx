import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Lock, User, UserPlus, Loader2, Activity } from 'lucide-react';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.match(emailRegex)) {
            setError('Please write correct email id');
            return;
        }

        // Password Validation
        // Min 7 chars, 1 uppercase, 1 special char
        if (password.length < 7 || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            setError('Password must be min 7 chars, with one capital letter and one special character');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/register', { username, email, password });
            login(res.data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
            <div className="fixed inset-0 bg-dark-900">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">SmartDash</h1>
                </div>

                <div className="glass-card rounded-2xl p-8">
                    <h2 className="text-xl font-bold text-white text-center mb-1">Create account</h2>
                    <p className="text-sm text-slate-400 text-center mb-6">Get started with SmartDash</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                    placeholder="johndoe" required
                                    className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5
                                    text-sm text-white placeholder-slate-600
                                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                                    transition-all duration-200"
                                />
                            </div>
                        </div>


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
                                    placeholder="Min 7 chars, 1 Upper, 1 Special"
                                    className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5
                                    text-sm text-white placeholder-slate-600
                                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                                    transition-all duration-200"
                                />
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="flex items-center justify-center gap-2 w-full py-2.5 mt-2
                            bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg
                            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                            shadow-lg shadow-indigo-600/20 cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
