import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Cookies from 'js-cookie';
import {
  useGetClubsQuery,
  useGetFundsByClubQuery,
  useGetFundHistoryQuery,
  useCreateFundRequestMutation,
  useProcessFundRequestMutation,
} from '~/cores/api';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useTheme } from '~/hooks/useTheme';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useClubRole } from '~/hooks/useClubRole';
import type { FundHistoryItem } from '~/cores/api';

export default function FundsPage() {
  const { isDark } = useTheme();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { isAdmin, clubManagerMembership } = useClubRole();

  // Club: Admin chọn club; Club Manager dùng club của mình
  const effectiveClubId = clubManagerMembership?.clubId ?? 0;
  const [selectedClubId, setSelectedClubId] = useState<number>(effectiveClubId);
  const clubId = isAdmin ? selectedClubId : effectiveClubId;

  const [fundId, setFundId] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processTarget, setProcessTarget] = useState<FundHistoryItem | null>(null);
  const [processApproved, setProcessApproved] = useState(true);
  const [processNote, setProcessNote] = useState('');

  // Create request form state
  const [createAmount, setCreateAmount] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPurpose, setCreatePurpose] = useState('');

  const hasToken = !!Cookies.get('accessToken');
  const { data: clubs = [] } = useGetClubsQuery(undefined, { skip: !hasToken || !isAdmin });
  const { data: funds = [] } = useGetFundsByClubQuery(clubId, { skip: !hasToken || clubId < 1 });
  const { data: history = [], isLoading, error } = useGetFundHistoryQuery(
    { fundId, status: statusFilter || undefined },
    { skip: !hasToken || !fundId || fundId < 1 }
  );
  const isUnauthorized = error && 'status' in error && error.status === 401;

  const availableFunds = funds;

  useEffect(() => {
    if (!isAdmin && effectiveClubId > 0) setSelectedClubId(effectiveClubId);
  }, [isAdmin, effectiveClubId]);
  useEffect(() => {
    if (isAdmin && clubs.length > 0 && selectedClubId === 0) setSelectedClubId(clubs[0].clubId);
  }, [isAdmin, clubs, selectedClubId]);
  useEffect(() => {
    if (availableFunds.length > 0 && fundId === 0) setFundId(availableFunds[0].fundId);
  }, [availableFunds, fundId]);

  const [createRequest, { isLoading: isCreating }] = useCreateFundRequestMutation();
  const [processRequest, { isLoading: isProcessing }] = useProcessFundRequestMutation();

  const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
  const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const inputClass = isDark
    ? 'bg-[#1a1d2e] border-slate-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(createAmount);
    if (!fundId || isNaN(amount) || !createDescription.trim()) return;
    try {
      await createRequest({
        fundId,
        amount,
        description: createDescription.trim(),
        purpose: createPurpose.trim() || undefined,
      }).unwrap();
      setShowCreateForm(false);
      setCreateAmount('');
      setCreateDescription('');
      setCreatePurpose('');
    } catch (err) {
      console.error('Create fund request failed:', err);
    }
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processTarget) return;
    try {
      await processRequest({
        requestId: processTarget.id,
        approved: processApproved,
        note: processNote.trim() || undefined,
      }).unwrap();
      setProcessTarget(null);
      setProcessNote('');
    } catch (err) {
      console.error('Process fund request failed:', err);
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar currentPath="/funds" isOpen={isSidebarOpen} />
      <HeaderBar
        title="Budget Overview"
        breadcrumb="Pages / Manage Funds / Budget Overview"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <h1 className={`text-3xl font-bold ${textClass}`}>Budget Overview</h1>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <>
                <label className={`${textClass} text-sm font-medium`}>Câu lạc bộ:</label>
                <select
                  value={clubId}
                  onChange={(e) => {
                    setSelectedClubId(Number(e.target.value));
                    setFundId(0);
                  }}
                  className={`px-3 py-2 rounded-lg border ${inputClass}`}
                >
                  <option value={0}>-- Chọn CLB --</option>
                  {clubs.map((c) => (
                    <option key={c.clubId} value={c.clubId}>
                      {c.clubName} (ID: {c.clubId})
                    </option>
                  ))}
                </select>
              </>
            )}
            <label className={`${textClass} text-sm font-medium`}>Quỹ:</label>
            <select
              value={fundId}
              onChange={(e) => setFundId(Number(e.target.value))}
              className={`px-3 py-2 rounded-lg border ${inputClass}`}
              disabled={!clubId || availableFunds.length === 0}
            >
              <option value={0}>-- Chọn quỹ --</option>
              {availableFunds.map((f) => (
                <option key={f.fundId} value={f.fundId}>
                  {f.fundName || `Quỹ #${f.fundId}`} (ID: {f.fundId})
                </option>
              ))}
            </select>
            <label className={`${textClass} text-sm font-medium`}>
              Trạng thái:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${inputClass}`}
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus" />
              New Request
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className={`${cardClass} rounded-lg shadow-md p-6 mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${textClass}`}>
              Create fund request
            </h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-md">
              <div>
                <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createAmount}
                  onChange={(e) => setCreateAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                  Description
                </label>
                <input
                  type="text"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                  Purpose (optional)
                </label>
                <input
                  type="text"
                  value={createPurpose}
                  onChange={(e) => setCreatePurpose(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isCreating ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {processTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${cardClass} rounded-lg shadow-xl p-6 max-w-md w-full`}>
              <h2 className={`text-xl font-semibold mb-4 ${textClass}`}>
                Process request #{processTarget.id}
              </h2>
              <form onSubmit={handleProcessSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={processApproved}
                      onChange={() => setProcessApproved(true)}
                    />
                    <span className={textClass}>Approve</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!processApproved}
                      onChange={() => setProcessApproved(false)}
                    />
                    <span className={textClass}>Reject</span>
                  </label>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Note (optional)
                  </label>
                  <textarea
                    value={processNote}
                    onChange={(e) => setProcessNote(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded-lg ${processApproved ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white disabled:opacity-50`}
                  >
                    {isProcessing ? 'Processing...' : processApproved ? 'Approve' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProcessTarget(null);
                      setProcessNote('');
                    }}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={`${cardClass} rounded-lg shadow-md overflow-hidden`}>
          {!hasToken ? (
            <div className="p-12 text-center">
              <i className="fas fa-lock text-6xl text-amber-500 dark:text-amber-400 mb-4" />
              <h3 className={`text-xl font-semibold mb-2 ${textClass}`}>
                Authentication required
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">
                Please log in to view fund history and manage requests.
              </p>
              <Link
                to="/auth/login"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse h-8 bg-gray-300 dark:bg-slate-600 rounded w-1/3 mx-auto mb-4" />
              <div className="animate-pulse h-4 bg-gray-300 dark:bg-slate-600 rounded w-2/3 mx-auto" />
            </div>
          ) : isUnauthorized ? (
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
              <h3 className="text-amber-800 dark:text-amber-200 font-semibold">
                Session expired or not logged in
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm mt-2 mb-4">
                Please log in again to view fund history.
              </p>
              <Link
                to="/auth/login"
                className="inline-block px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
              >
                Log in again
              </Link>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <h3 className="text-red-800 dark:text-red-200 font-semibold">
                Error loading fund history
              </h3>
              <p className="text-red-600 dark:text-red-300 text-sm mt-2">
                {'status' in error ? `Error ${error.status}` : 'Request failed'}
              </p>
            </div>
          ) : !clubId && !isAdmin ? (
            <div className="p-12 text-center">
              <i className="fas fa-users text-6xl text-gray-400 mb-4" />
              <p className={`text-gray-500 ${textClass}`}>
                Bạn chưa được gán vào câu lạc bộ nào. Liên hệ quản trị viên để được cấp quyền.
              </p>
            </div>
          ) : !fundId || availableFunds.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-wallet text-6xl text-gray-400 mb-4" />
              <p className={`text-gray-500 ${textClass}`}>
                {!clubId ? 'Chọn câu lạc bộ để xem quỹ.' : 'Câu lạc bộ này chưa có quỹ nào.'}
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-history text-6xl text-gray-400 mb-4" />
              <p className={`text-gray-500 ${textClass}`}>
                Chưa có lịch sử giao dịch. Tạo yêu cầu mới hoặc chọn quỹ khác.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-slate-700' : 'bg-gray-100'}>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-slate-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}
                    >
                      <td className="px-4 py-3 text-sm">{item.id}</td>
                      <td className="px-4 py-3 text-sm">{item.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'Approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : item.status === 'Rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.description ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'Pending' && (
                          <button
                            onClick={() => setProcessTarget(item)}
                            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                          >
                            Process
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
