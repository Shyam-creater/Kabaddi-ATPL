import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, Trophy } from 'lucide-react';
import logo from '../assets/images/ATPL-LOGO.jpeg';

const roles = [
  {
    id: 'admin',
    label: 'Admin / Sub-Admin',
    description: 'Dashboard, users, teams & admin privileges',
    icon: ShieldCheck,
    route: '/login',
    gradient: 'from-indigo-500 to-violet-600',
    glow: 'rgba(99, 102, 241, 0.25)',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    delay: '0.1s',
  },
  {
    id: 'th',
    label: 'Tournament Head',
    description: 'Manage leagues, teams & match schedules',
    icon: Trophy,
    route: '/th-login',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245, 158, 11, 0.25)',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    delay: '0.2s',
  },
  {
    id: 'scorer',
    label: 'Scorer',
    description: 'Live scoring & match updates',
    icon: Users,
    route: '/th-login',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16, 185, 129, 0.25)',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    delay: '0.3s',
  },
];

export default function LoginChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[120px] opacity-50" />
        <div className="absolute top-[30%] right-[-5%] w-[35%] h-[35%] bg-fuchsia-500/10 rounded-full blur-[100px] opacity-50" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] opacity-40" />
      </div>

      {/* Main Card */}
      <div
        className="relative w-full max-w-md z-10"
        style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <img
              src={logo}
              alt="ATPL"
              className="w-16 h-16 rounded-2xl shadow-md mx-auto mb-5 object-cover"
              style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            />
            <h1 className="text-2xl font-black text-gray-900 mb-1.5">Welcome Back</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Choose your portal to get started
            </p>
          </div>

          {/* Divider */}
          <div className="px-8">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Role Cards */}
          <div className="px-6 py-6 space-y-3">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => navigate(role.route)}
                  className="group w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 transition-all duration-300 text-left"
                  style={{
                    animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${role.delay} both`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      `0 8px 30px -8px ${role.glow}`;
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-11 h-11 rounded-xl ${role.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`w-5 h-5 ${role.iconColor}`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-[15px] leading-tight">
                      {role.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                      {role.description}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-900 transition-colors duration-300">
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-2 text-center">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />
            <p className="text-[11px] text-gray-400 font-medium">
              Protected by AattumTPL Security
            </p>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
