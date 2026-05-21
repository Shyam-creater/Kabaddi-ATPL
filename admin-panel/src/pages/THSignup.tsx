import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/ATPL-LOGO.jpeg';
import { authService } from '../services/auth';
import { ArrowRight, Lock, Mail, ShieldCheck, User, Phone, MapPin, Camera } from 'lucide-react';

export default function THSignup() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authService.thSignup({
                name,
                email,
                password,
                phone,
                city,
                address,
                profilePicture
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/th-login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] opacity-40 animate-float" />
            </div>

            <div className="w-full max-w-5xl grid md:grid-cols-5 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-white/50 relative z-10 glass">
                {/* Left Side: Brand / Visual (2/5 cols) */}
                <div className="hidden md:flex md:col-span-2 flex-col justify-between p-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-pattern opacity-10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 mb-6">
                            <ShieldCheck size={24} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                        <p className="text-gray-400 leading-relaxed text-sm">Join the AattumTPL network as a Tournament Head (TH). Manage your own leagues, teams, match schedules, and player registrations in an isolated regional namespace.</p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">TH Account Benefits</p>
                            <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
                                <li>Custom Regional League Scoping</li>
                                <li>Exclusive Team Control Panels</li>
                                <li>Direct Player Registration Approval</li>
                                <li>MNC-Level Security & Role Isolation</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form (3/5 cols) */}
                <div className="p-8 md:p-12 md:col-span-3 flex flex-col justify-center bg-white/80 backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="mb-6 text-center md:text-left">
                        <img src={logo} alt="ATPL" className="w-16 h-16 rounded-2xl shadow-md mb-4 mx-auto md:mx-0 object-cover" />
                        <h1 className="text-2xl font-black text-gray-900 mb-1">Tournament Head Registration</h1>
                        <p className="text-sm text-gray-500">Sign up now to begin hosting leagues.</p>
                    </div>

                    {success ? (
                        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-center my-8">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg animate-bounce">✓</div>
                            <h3 className="text-lg font-black text-emerald-900 mb-2">Registration Successful!</h3>
                            <p className="text-sm text-emerald-700">Your account has been created. Redirecting to Login interface...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-shake">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error}
                                </div>
                            )}

                            {/* Profile Picture Upload Section */}
                            <div className="flex flex-col items-center md:items-start gap-3 pb-2 border-b border-gray-100">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Profile Picture</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group shadow-inner">
                                        {profilePicture ? (
                                            <img src={profilePicture} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-black uppercase text-slate-700 tracking-wider transition-all flex items-center gap-2 active:scale-95">
                                        <Camera size={14} />
                                        Upload Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">TH Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4.5 h-4.5" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-gray-900 shadow-sm"
                                            placeholder="Tournament Head Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mobile Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4.5 h-4.5" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-gray-900 shadow-sm"
                                            placeholder="ex. 9876543210"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4.5 h-4.5" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-gray-900 shadow-sm"
                                            placeholder="th@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4.5 h-4.5" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-gray-900 shadow-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Location (City)</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4.5 h-4.5" />
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-gray-900 shadow-sm"
                                            placeholder="ex. Chennai"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Address Detail</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors w-4.5 h-4.5" />
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-gray-900 shadow-sm"
                                            placeholder="ex. 12 Main St, Adyar"
                                        />
                                    </div>
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
                                        Register Tournament Head <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Already registered?{' '}
                            <button
                                onClick={() => navigate('/th-login')}
                                className="text-indigo-600 font-bold hover:underline"
                            >
                                Log In here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
