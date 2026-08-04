import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Share2,
  Users,
  Search,
  Trophy,
  UserCheck,
  Calendar,
  Building2,
  BookOpen,
  Eye,
  X,
  Sparkles,
  Link as LinkIcon,
  Filter,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const ReferralManagementModule: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [minFilter, setMinFilter] = useState<'all' | 'active'>('all');
  const [selectedReferrer, setSelectedReferrer] = useState<UserProfile | null>(null);

  // Load and subscribe to real-time users list
  useEffect(() => {
    const loadUsers = () => {
      const allUsers = StorageService.getUsers();
      setUsers(allUsers);
    };

    loadUsers();

    const handleStorageChange = () => {
      loadUsers();
    };

    window.addEventListener('cbt_storage_change', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    // Refresh every 3 seconds to keep real-time sync snappy
    const interval = setInterval(loadUsers, 3000);

    return () => {
      window.removeEventListener('cbt_storage_change', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Compute Metrics
  const totalReferrals = users.reduce((sum, u) => sum + (u.successfulReferrals || 0), 0);
  const usersWithCodeCount = users.filter((u) => Boolean(u.referralCode)).length;
  const activeReferrers = users.filter((u) => (u.successfulReferrals || 0) > 0);
  const activeReferrersCount = activeReferrers.length;

  // Sorted Leaderboard (highest successfulReferrals first)
  const sortedLeaderboard = [...users]
    .sort((a, b) => (b.successfulReferrals || 0) - (a.successfulReferrals || 0));

  // Filtered List
  const filteredUsers = sortedLeaderboard.filter((u) => {
    const matchesMin = minFilter === 'active' ? (u.successfulReferrals || 0) > 0 : true;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
      (u.universityName && u.universityName.toLowerCase().includes(q));
    return matchesMin && matchesSearch;
  });

  // Referred users for modal view
  const referredUsersList = selectedReferrer
    ? users.filter((u) => u.referredBy === selectedReferrer.id)
    : [];

  return (
    <div className="space-y-6" id="admin-referral-management-module">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl shrink-0">
              <Share2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Referral Management & Tracking</h2>
                <span className="text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Real-time tracking of student referrals across CBT Master. Track unique referral codes, referral links, and student acquisition counts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Successful Referrals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Referrals
            </span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{totalReferrals}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total successful sign-ups via referral</p>
        </div>

        {/* Active Referrers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Referrers
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-300 tracking-tight">{activeReferrersCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Users with ≥1 successful referral</p>
        </div>

        {/* Registered User Codes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assigned Codes
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-purple-300 tracking-tight">{usersWithCodeCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Permanent codes generated</p>
        </div>

        {/* Top Referrer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Top Referrer
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-300 truncate">
            {sortedLeaderboard[0]?.successfulReferrals ? sortedLeaderboard[0].name : 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {sortedLeaderboard[0]?.successfulReferrals
              ? `${sortedLeaderboard[0].successfulReferrals} Successful Referrals`
              : 'No referrals recorded yet'}
          </p>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            id="admin-referral-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setMinFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              minFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setMinFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              minFilter === 'active'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Active Referrers ({activeReferrersCount})
          </button>
        </div>
      </div>

      {/* Referral Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Referral Leaderboard</h3>
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Student Info</th>
                <th className="py-3.5 px-4">University & Dept</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4 text-center">Successful Referrals</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching referral records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const referrals = u.successfulReferrals || 0;
                  const rank = index + 1;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 text-center font-bold">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black">
                            🥇 1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 font-black">
                            🥈 2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40 font-black">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">#{rank}</span>
                        )}
                      </td>

                      {/* Student Info */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {u.email}
                        </div>
                      </td>

                      {/* University & Dept */}
                      <td className="py-4 px-4">
                        <div className="text-slate-300 font-medium truncate max-w-[180px]">
                          {u.universityName || 'Not Specified'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {u.departmentName || 'General'}
                        </div>
                      </td>

                      {/* Referral Code */}
                      <td className="py-4 px-4 font-mono font-bold text-indigo-400 tracking-wider">
                        <span className="bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          {u.referralCode || 'CBT8XK92'}
                        </span>
                      </td>

                      {/* Successful Referrals */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-xs ${
                            referrals > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {referrals}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setSelectedReferrer(u)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                          title="View Referred Users"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referred Users Modal / Detail Drawer */}
      {selectedReferrer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Referral Breakdown: {selectedReferrer.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Code: <span className="text-indigo-400 font-bold">{selectedReferrer.referralCode}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReferrer(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Referrer Stats Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500 block">Referrer Email</span>
                <p className="text-xs font-medium text-slate-200 mt-0.5 truncate">{selectedReferrer.email}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500 block">Total Successful Referrals</span>
                <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                  {selectedReferrer.successfulReferrals || 0} Users
                </p>
              </div>
            </div>

            {/* List of Referred Accounts */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Referred Accounts ({referredUsersList.length})
              </h4>

              {referredUsersList.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-500 space-y-1">
                  <p>No student accounts recorded with code <span className="font-mono text-indigo-400">{selectedReferrer.referralCode}</span> yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referredUsersList.map((refUser) => (
                    <div
                      key={refUser.id}
                      className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{refUser.name}</div>
                        <div className="text-[11px] text-slate-400">{refUser.email}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 block">
                          {refUser.universityName || 'CBT Student'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Joined {new Date(refUser.createdDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReferrer(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
