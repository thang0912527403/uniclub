import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { SettingButton } from '~/components/SettingButton';
import { Loading } from '~/components/Loading';
import { Error } from '~/components/Error';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import { useNotification } from '~/components/Notification';
import { useGetRecordsOfChangeQuery, useUndoRecordOfChangeMutation } from '~/cores/api';
import type { RecordOfChange, RecordOfChangeParams } from '~/cores/api/types/recordOfChange';
import { useRecordOfChangeSignalR } from './hooks/useRecordOfChangeSignalR';

const PAGE_SIZE = 10;

const ENTITY_OPTIONS = [
  'User', 'Club', 'Member', 'Department', 'ClubRole',
  'Event', 'Fund', 'RecruitmentCampaign', 'Interview', 'Application',
];

const CHANGE_TYPE_OPTIONS = [
  { value: 'CREATE', label: 'Tạo mới', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { value: 'UPDATE', label: 'Cập nhật', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'DELETE', label: 'Xóa', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'SOFT DELETE', label: 'Xóa', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
];

function ChangeTypeBadge({ type }: { type: string }) {
  const opt = CHANGE_TYPE_OPTIONS.find((o) => o.value === type);
  return opt ? (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${opt.color}`}>
      {opt.label}
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {type}
    </span>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function truncate(str: string | null | undefined, maxLen = 60) {
  if (!str) return null;
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/* ─── Detail Drawer ─── */
function RecordDetailDrawer({
  record,
  onClose,
  onUndo,
  isUndoing,
}: {
  record: RecordOfChange;
  onClose: () => void;
  onUndo: () => void;
  isUndoing: boolean;
}) {
  const changeTypeOpt = CHANGE_TYPE_OPTIONS.find((o) => o.value === record.changeType);
  const canUndo = (record.changeType === 'UPDATE' || record.changeType === 'SOFT DELETE') && record.isUndo === false;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <i className="fas fa-file-alt text-violet-600 dark:text-violet-400 text-sm" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Chi tiết thay đổi</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(record.changedAt)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Loại entity</p>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                {record.entityName}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hành động</p>
              <ChangeTypeBadge type={record.changeType} />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Người thay đổi</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {record.changedByName || '—'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Thời gian</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {formatDate(record.changedAt)}
              </p>
            </div>
          </div>

          {/* Notification */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Thông báo
            </p>
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${changeTypeOpt?.color ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
              {record.notification || '—'}
            </div>
          </div>

          {/* Old value */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Giá trị cũ
              </p>
            </div>
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl max-h-52 overflow-y-auto font-mono leading-relaxed">
              {record.oldValue || '(trống)'}
            </pre>
          </div>

          {/* New value */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Giá trị mới
              </p>
            </div>
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl max-h-52 overflow-y-auto font-mono leading-relaxed">
              {record.newValue || '(trống)'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex gap-3">
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={isUndoing}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isUndoing
                ? <><i className="fas fa-spinner fa-spin" />Đang hoàn tác...</>
                : <><i className="fas fa-undo" />Hoàn tác</>
              }
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main Module ─── */
export default function RecordOfChangeModule() {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();
  const { show: showNotification } = useNotification();

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [entityName, setEntityName] = useState('');
  const [changeType, setChangeType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [oldValueSearch, setOldValueSearch] = useState('');
  const [newValueSearch, setNewValueSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordOfChange | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  const queryParams: RecordOfChangeParams = {
    pageNumber: currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    entityName: entityName || undefined,
    changeType: changeType || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    oldValueSearch: oldValueSearch || undefined,
    newValueSearch: newValueSearch || undefined,
  };

  const { data, isLoading, error, refetch } = useGetRecordsOfChangeQuery(queryParams, {
    pollingInterval: 15000,
  });
  const [undoRecord, { isLoading: isUndoing }] = useUndoRecordOfChangeMutation();
  const records: RecordOfChange[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const { isConnected } = useRecordOfChangeSignalR({
    onNewRecord: (record) => {
      showNotification({
        type: 'info',
        title: 'Có thay đổi mới',
        message: record.notification ?? `${record.entityName} - ${record.changeType}`,
        duration: 5000,
      });
      refetch();
    },
  });

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleUndo = async () => {
    if (!selectedRecord) return;
    try {
      await undoRecord(selectedRecord.id).unwrap();
      showNotification({ type: 'success', title: 'Hoàn tác thành công', message: selectedRecord.notification });
      setSelectedRecord(null);
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } };
      showNotification({ type: 'error', title: 'Hoàn tác thất bại', message: err?.data?.message ?? 'Vui lòng thử lại sau.' });
    }
  };

  const resetFilters = () => {
    setSearch('');
    setEntityName('');
    setChangeType('');
    setFromDate('');
    setToDate('');
    setOldValueSearch('');
    setNewValueSearch('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search || entityName || changeType || fromDate || toDate || oldValueSearch || newValueSearch;

  const hasAdvancedFilters = fromDate || toDate || oldValueSearch || newValueSearch;

  return (
    <div className="min-h-screen">
      <SettingButton />
      <Sidebar currentPath="/record-of-change" isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <HeaderBar
        title="Nhật ký thay đổi"
        breadcrumb="Bảng điều khiển / Nhật ký thay đổi"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 p-6 transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'md:ml-64' : 'ml-0'
        } bg-gradient-to-b from-violet-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950`}
      >
        {/* Page header */}
        <section className="mb-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                Nhật ký thay đổi
              </h2>
              <p className="text-sm text-violet-700/80 dark:text-violet-200/70">
                Theo dõi lịch sử thay đổi dữ liệu theo thời gian thực.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isConnected
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                />
                {isConnected ? 'Thời gian thực' : 'Chưa kết nối'}
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
              >
                <i className="fas fa-sync-alt" />
                Làm mới
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Tổng bản ghi', value: totalCount, icon: 'fa-history', color: 'bg-violet-600' },
              {
                label: 'Tạo mới',
                value: records.filter((r) => r.changeType === 'CREATE').length,
                icon: 'fa-plus-circle',
                color: 'bg-green-500',
              },
              {
                label: 'Cập nhật',
                value: records.filter((r) => r.changeType === 'UPDATE').length,
                icon: 'fa-edit',
                color: 'bg-blue-500',
              },
              {
                label: 'Xóa',
                value: records.filter((r) => r.changeType === 'DELETE').length,
                icon: 'fa-trash',
                color: 'bg-red-500',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/90 dark:bg-gray-900/70 rounded-2xl shadow-sm border border-violet-100/60 dark:border-gray-700 p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}
                >
                  <i className={`fas ${stat.icon} text-white text-sm`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên entity, thông báo, giá trị..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 outline-none transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="fas fa-times text-sm" />
                  </button>
                )}
              </div>

              {/* Entity type */}
              <select
                value={entityName}
                onChange={(e) => { setEntityName(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all min-w-[140px]"
              >
                <option value="">Tất cả loại</option>
                {ENTITY_OPTIONS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>

              {/* Change type */}
              <select
                value={changeType}
                onChange={(e) => { setChangeType(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all min-w-[140px]"
              >
                <option value="">Tất cả hành động</option>
                {CHANGE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Advanced toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  showAdvanced || hasAdvancedFilters
                    ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                }`}
              >
                <i className="fas fa-sliders-h" />
                Nâng cao
                {hasAdvancedFilters && <span className="w-2 h-2 rounded-full bg-violet-500" />}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium transition-all cursor-pointer flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <i className="fas fa-times" />
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Advanced filters */}
            {showAdvanced && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 flex-wrap items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Từ ngày</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 focus:border-violet-400 outline-none transition-all"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 focus:border-violet-400 outline-none transition-all"
                  />
                </div>
                <input
                  type="text"
                  value={oldValueSearch}
                  onChange={(e) => { setOldValueSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Tìm trong giá trị cũ..."
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-violet-400 outline-none transition-all"
                />
                <input
                  type="text"
                  value={newValueSearch}
                  onChange={(e) => { setNewValueSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Tìm trong giá trị mới..."
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-violet-400 outline-none transition-all"
                />
              </div>
            )}
          </div>
        </section>

        {/* Content */}
        {isLoading && <Loading message="Đang tải nhật ký thay đổi..." />}
        {error && <Error title="Lỗi khi tải nhật ký thay đổi." error={error} />}

        {!isLoading && !error && (
          <div className="bg-white/95 dark:bg-gray-900/80 rounded-2xl shadow-sm border border-violet-100/70 dark:border-gray-700 overflow-hidden">
            {records.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
                  <i className="fas fa-history text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không có dữ liệu</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Chưa có nhật ký thay đổi nào phù hợp với bộ lọc hiện tại.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-violet-50/80 dark:bg-violet-900/30">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-violet-900 dark:text-violet-50 whitespace-nowrap">
                        Thời gian
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-violet-900 dark:text-violet-50">
                        Loại entity
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-violet-900 dark:text-violet-50">
                        Hành động
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-violet-900 dark:text-violet-50">
                        Thông báo
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-violet-900 dark:text-violet-50 whitespace-nowrap">
                        Người thay đổi
                      </th>
                      <th className="py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-violet-50/70 dark:hover:bg-gray-800/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(record.changedAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {record.entityName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <ChangeTypeBadge type={record.changeType} />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 max-w-[260px]">
                          <span title={record.notification ?? ''}>
                            {truncate(record.notification, 90) ?? '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.changedByName || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <i className="fas fa-chevron-right text-gray-300 dark:text-gray-600 group-hover:text-violet-400 dark:group-hover:text-violet-500 transition-colors text-xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-wrap gap-3 bg-white/80 dark:bg-gray-900/60">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, totalCount)} /{' '}
                  {totalCount.toLocaleString()} bản ghi
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-violet-100 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <i className="fas fa-chevron-left mr-1" />
                    Trang trước
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-violet-100 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Trang sau
                    <i className="fas fa-chevron-right ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedRecord && (
        <RecordDetailDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUndo={handleUndo}
          isUndoing={isUndoing}
        />
      )}
    </div>
  );
}
