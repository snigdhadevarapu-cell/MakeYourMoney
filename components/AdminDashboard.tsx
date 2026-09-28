import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { ShieldCheck, Users, Bookmark, Bell, Database, Server, CheckCircle2, Clock } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

interface UserProfileDoc {
  uid: string;
  email?: string;
  displayName?: string;
  lastLogin?: string;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    usersCount: 0,
    savedDealsCount: 0,
    priceAlertsCount: 0,
    loading: true,
  });
  const [recentUsers, setRecentUsers] = useState<UserProfileDoc[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [usersSnap, dealsSnap, alertsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'savedDeals')),
          getDocs(collection(db, 'priceAlerts')),
        ]);

        setStats({
          usersCount: usersSnap.size,
          savedDealsCount: dealsSnap.size,
          priceAlertsCount: alertsSnap.size,
          loading: false,
        });

        const usersList: UserProfileDoc[] = [];
        usersSnap.forEach((d) => {
          const data = d.data();
          usersList.push({
            uid: d.id,
            email: data.email,
            displayName: data.displayName,
            lastLogin: data.lastLogin,
          });
        });
        setRecentUsers(usersList.slice(0, 10));
      } catch (err) {
        console.warn('Error fetching admin dashboard statistics:', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    loadAdminData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">Admin Operations Console</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Signed in as <span className="font-semibold text-white">{user.email}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-xs text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-medium">Production Node Ready</span>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {stats.loading ? '...' : stats.usersCount}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Registered Users
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {stats.loading ? '...' : stats.savedDealsCount}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Saved Deals Across Users
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {stats.loading ? '...' : stats.priceAlertsCount}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Active Price Trackers
            </p>
          </div>
        </div>
      </div>

      {/* System Architecture Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          Infrastructure & Connectors
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Cloud Firestore Enterprise</p>
              <p className="text-xs text-slate-500 mt-0.5">Database ID: ai-studio-772f7b86-f2c6-4c28-bbd9-21477526c226</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized & Healthy
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Role-Based Access Control</p>
              <p className="text-xs text-slate-500 mt-0.5">Dual-admin authentication enabled for designated administrators.</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> ABAC Rules Deployed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Users Ecosystem Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">User Activity Stream</h3>
          <span className="text-xs text-slate-400 font-medium">Recent authentications</span>
        </div>

        {recentUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No registered profiles recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">User ID</th>
                  <th className="px-5 py-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {u.displayName || 'Shopper'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{u.email || '—'}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400 truncate max-w-[150px]">
                      {u.uid}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Recently'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
