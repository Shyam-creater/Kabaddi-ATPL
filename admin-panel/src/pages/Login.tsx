import { useState } from 'react';
import type { FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/authSlice';
import logo from '../assets/images/ATPL-LOGO.jpeg';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state: any) => state.auth);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        dispatch(clearError());

        const result: any = await dispatch(login({ email, password }) as any);
        if (result.type === 'auth/login/fulfilled') {
            if (result.payload.user.role === 'admin') {
                navigate('/dashboard');
            } else {
                alert('Access denied. Admin privileges required.');
                dispatch(clearError());
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] opacity-40 animate-float" />
            </div>

            <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-white/50 relative z-10 glass">

                {/* Left Side: Brand / Visual */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-pattern opacity-10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 mb-6">
                            <ShieldCheck size={24} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Secure Access</h2>
                        <p className="text-gray-400 leading-relaxed text-sm">Welcome to the central command for AattumTPL Score. Manage matches, users, and tournaments with ease.</p>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">System Status</p>
                                <p className="font-bold">Operational</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center bg-white/80 backdrop-blur-xl">
                    <div className="mb-8 text-center md:text-left">
                        <img src={logo} alt="ATPL" className="w-16 h-16 rounded-2xl shadow-md mb-6 mx-auto md:mx-0 object-cover" />
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Admin Login</h1>
                        <p className="text-sm text-gray-500">Please enter your credentials to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 shadow-sm"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In Interface <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center md:text-left">
                        <p className="text-xs text-gray-400 font-medium">Protected by AattumTPL Security</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
