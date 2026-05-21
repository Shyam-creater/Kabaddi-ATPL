import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, Trophy } from 'lucide-react';

export default function LoginChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-16 right-[-5%] w-72 h-72 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/70 border border-white/60 shadow-sm flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Login Choice</h1>
          <p className="text-sm text-gray-500 mt-2">Pick the right portal. Simple & fast.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="font-black">Admin / Sub-Admin</span>
              </div>
              <div className="text-sm text-gray-600">Dashboard, users, teams (admin privileges)</div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/th-login')}
            className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-indigo-600" />
                <span className="font-black">Tournament Head (TH)</span>
              </div>
              <div className="text-sm text-gray-600">Manage your leagues, teams, match schedules</div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/th-login')}
            className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span className="font-black">Scorer</span>
              </div>
              <div className="text-sm text-gray-600">Use TH login form (scorer role allowed)</div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="text-center text-[11px] text-gray-400 mt-6">
          Tip: Your seeded credentials use password <span className="font-bold">password123</span>.
        </div>
      </div>
    </div>
  );
}

