import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  useGetClubMembersQuery,
  useGetFundCategoriesQuery,
  useRecordCashContributionMutation,
} from '~/cores/api';
import type { RecordCashContributionResponse } from '~/cores/api/types';
import { extractClubFundErrorMessage } from '~/modules/funds/utils/fundRefundErrors';
import {
  FUND_CASH_CONTRIBUTION_MIN_AMOUNT,
  FUND_CASH_MEMBER_FORCE_SEARCH_MIN,
  FUND_CASH_MEMBER_MAX_VISIBLE,
  FUND_CASH_MEMBER_SEARCH_MIN_CHARS,
  FUND_CASH_NOTE_MAX_LENGTH,
  FUND_CASH_NOTE_MIN_LENGTH,
} from '~/modules/funds/constants/fundCashContribution';
import { parseVndIntegerFromInput } from '~/routes/funds.utils';
import { fundTokens as t } from '~/routes/funds.design-tokens';
import { useNotification } from '~/components/Notification';

function contributedAtLocalToUtcIso(local: string): string | undefined {
  const trimmed = local.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export type RecordCashContributionFormProps = {
  clubId: number;
  presetFundId: number;
  fundLabel?: string;
  isDark?: boolean;
  embeddedInModal?: boolean;
  onRecorded?: (payload: RecordCashContributionResponse) => void;
};

export function RecordCashContributionForm({
  clubId,
  presetFundId,
  fundLabel,
  isDark = false,
  embeddedInModal = false,
  onRecorded,
}: RecordCashContributionFormProps) {
  const formId = useId();
  const { show: showNotification } = useNotification();
  const [memberSearch, setMemberSearch] = useState('');
  const [contributorUserId, setContributorUserId] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [note, setNote] = useState('');
  const [categoryIdStr, setCategoryIdStr] = useState('');
  const [contributedAtLocal, setContributedAtLocal] = useState('');
  const [lastSuccess, setLastSuccess] = useState<RecordCashContributionResponse | null>(null);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const memberPickerRef = useRef<HTMLDivElement>(null);
  const memberSearchInputRef = useRef<HTMLInputElement>(null);
  const [memberDropdownLayout, setMemberDropdownLayout] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const { data: members = [], isLoading: membersLoading } = useGetClubMembersQuery(clubId, {
    skip: clubId < 1,
  });
  const { data: categories = [] } = useGetFundCategoriesQuery(clubId, {
    skip: clubId < 1,
  });
  const [recordCash, { isLoading: isSubmitting }] = useRecordCashContributionMutation();

  const activeMembers = useMemo(
    () => members.filter((m) => String(m.status ?? '').toUpperCase() === 'ACTIVE'),
    [members],
  );

  const largeMemberList = activeMembers.length > FUND_CASH_MEMBER_FORCE_SEARCH_MIN;
  const searchChars = memberSearch.trim().length;
  const searchGateOk =
    !largeMemberList || searchChars >= FUND_CASH_MEMBER_SEARCH_MIN_CHARS;

  const selectedMember = useMemo(
    () => activeMembers.find((m) => m.userId === contributorUserId),
    [activeMembers, contributorUserId],
  );

  const filteredMembers = useMemo(() => {
    if (!searchGateOk) return [];
    const q = memberSearch.trim().toLowerCase();
    if (!q) return activeMembers.slice(0, FUND_CASH_MEMBER_MAX_VISIBLE);
    return activeMembers
      .filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.studentId && String(m.studentId).toLowerCase().includes(q)),
      )
      .slice(0, FUND_CASH_MEMBER_MAX_VISIBLE);
  }, [activeMembers, memberSearch, searchGateOk]);

  const memberMatchCount = useMemo(() => {
    if (!searchGateOk) return 0;
    const q = memberSearch.trim().toLowerCase();
    if (!q) return activeMembers.length;
    return activeMembers.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.studentId && String(m.studentId).toLowerCase().includes(q)),
    ).length;
  }, [activeMembers, memberSearch, searchGateOk]);

  const listTruncated = memberMatchCount > FUND_CASH_MEMBER_MAX_VISIBLE;

  useEffect(() => {
    if (!memberPickerOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const root = memberPickerRef.current;
      if (root && !root.contains(e.target as Node)) setMemberPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMemberPickerOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [memberPickerOpen]);

  useEffect(() => {
    if (memberPickerOpen) {
      window.setTimeout(() => memberSearchInputRef.current?.focus(), 0);
    }
  }, [memberPickerOpen]);

  useLayoutEffect(() => {
    if (!memberPickerOpen) {
      setMemberDropdownLayout(null);
      return;
    }
    const measure = () => {
      const el = memberPickerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const maxH = Math.min(280, Math.max(120, window.innerHeight - r.bottom - gap - 16));
      setMemberDropdownLayout({
        top: r.bottom + gap,
        left: r.left,
        width: Math.max(220, r.width),
        maxHeight: maxH,
      });
    };
    measure();
    const onWin = () => measure();
    window.addEventListener('resize', onWin);
    document.addEventListener('scroll', onWin, true);
    return () => {
      window.removeEventListener('resize', onWin);
      document.removeEventListener('scroll', onWin, true);
    };
  }, [memberPickerOpen, selectedMember, contributorUserId]);

  const inputClass = isDark
    ? 'bg-[#0f1729] border-slate-600 text-slate-50 placeholder:text-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400';

  const clientErrors = useMemo(() => {
    const errs: string[] = [];
    const parsed = parseVndIntegerFromInput(amountRaw);
    if (!contributorUserId.trim()) errs.push('Chọn thành viên đã nộp tiền mặt.');
    if (!parsed.ok) {
      errs.push(parsed.message);
    } else if (parsed.amount < FUND_CASH_CONTRIBUTION_MIN_AMOUNT) {
      errs.push(`Số tiền tối thiểu ${FUND_CASH_CONTRIBUTION_MIN_AMOUNT.toLocaleString('vi-VN')} ₫.`);
    }
    const n = note.trim();
    if (n.length > 0 && n.length < FUND_CASH_NOTE_MIN_LENGTH) {
      errs.push(`Ghi chú nếu có thì tối thiểu ${FUND_CASH_NOTE_MIN_LENGTH} ký tự.`);
    }
    if (n.length > FUND_CASH_NOTE_MAX_LENGTH) {
      errs.push(`Ghi chú tối đa ${FUND_CASH_NOTE_MAX_LENGTH} ký tự.`);
    }
    if (contributedAtLocal.trim()) {
      const iso = contributedAtLocalToUtcIso(contributedAtLocal);
      if (!iso) errs.push('Thời điểm nộp không hợp lệ.');
    }
    return errs;
  }, [amountRaw, contributorUserId, contributedAtLocal, note]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLastSuccess(null);
    if (clientErrors.length > 0) {
      showNotification({
        type: 'error',
        title: 'Kiểm tra form',
        message: clientErrors[0] ?? 'Dữ liệu chưa hợp lệ.',
      });
      return;
    }
    const parsed = parseVndIntegerFromInput(amountRaw);
    if (!parsed.ok) return;
    const categoryId = categoryIdStr ? Number(categoryIdStr) : undefined;
    const body = {
      fundId: presetFundId,
      contributorUserId: contributorUserId.trim(),
      amount: parsed.amount,
      note: note.trim(),
      ...(Number.isFinite(categoryId) && (categoryId as number) > 0 ? { categoryId } : {}),
      ...(() => {
        const iso = contributedAtLocalToUtcIso(contributedAtLocal);
        return iso ? { contributedAtUtc: iso } : {};
      })(),
    };
    try {
      const res = await recordCash({ clubId, body }).unwrap();
      setLastSuccess(res);
      setAmountRaw('');
      setNote('');
      setContributedAtLocal('');
      showNotification({
        type: 'success',
        title: 'Đã ghi nhận tiền mặt',
        message: `Giao dịch #${res.transactionId} — Số dư mới: ${res.newCurrentBalance.toLocaleString('vi-VN')} ₫`,
      });
      onRecorded?.(res);
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'status' in err ? (err as { status?: number }).status : undefined;
      const msg = extractClubFundErrorMessage(err);
      showNotification({
        type: 'error',
        title: status === 403 ? 'Không đủ quyền' : status === 404 ? 'Không tìm thấy' : 'Không ghi nhận được',
        message:
          msg ||
          (status === 403
            ? 'Chỉ Quản lý CLB cấp 1 (hoặc Admin) mới được ghi nhận tiền mặt.'
            : 'Vui lòng thử lại hoặc kiểm tra dữ liệu.'),
      });
    }
  };

  return (
    <div className="space-y-4">
      {embeddedInModal ? (
        <div className="pb-1 border-b border-slate-200 dark:border-slate-600 space-y-2">
          {fundLabel ? (
            <p className={`text-sm font-medium ${t.type.body}`}>
              Quỹ: <span className="text-amber-700 dark:text-amber-300">{fundLabel}</span>
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <h3 className={t.type.sectionTitle}>Ghi nhận đóng quỹ tiền mặt</h3>
          <p className={`mt-1 text-sm ${t.type.muted}`}>
            Thành viên đã nộp tiền mặt cho bạn ngoài PayOS. Giao dịch được tạo ở trạng thái đã duyệt, số dư quỹ cập nhật ngay.
          </p>
          {fundLabel ? (
            <p className={`mt-2 text-sm font-medium ${t.type.body}`}>
              Quỹ: <span className="text-amber-700 dark:text-amber-300">{fundLabel}</span>
            </p>
          ) : null}
        </div>
      )}

      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div ref={memberPickerRef} className="relative">
          <span id={`${formId}-member-label`} className={`block text-sm font-medium mb-1 ${t.type.body}`}>
            Thành viên
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              id={`${formId}-member-trigger`}
              aria-haspopup="listbox"
              aria-expanded={memberPickerOpen}
              aria-labelledby={`${formId}-member-label`}
              disabled={isSubmitting || membersLoading}
              onClick={() => {
                if (isSubmitting || membersLoading) return;
                setMemberPickerOpen((o) => !o);
              }}
              className={`${t.input} flex flex-1 min-w-0 items-center justify-between gap-2 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="min-w-0 truncate">
                {selectedMember ? (
                  <>
                    <span className="font-medium">{selectedMember.fullName}</span>
                    <span className={`block truncate text-xs font-normal ${t.type.muted}`}>{selectedMember.email}</span>
                  </>
                ) : (
                  <span className={`${t.type.muted}`}>Chọn thành viên…</span>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${memberPickerOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {selectedMember ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setContributorUserId('');
                  setMemberSearch('');
                }}
                className={`${t.btn.secondary} !min-h-0 !px-3 !py-2 text-sm shrink-0`}
                aria-label="Xóa thành viên đã chọn"
              >
                Xóa
              </button>
            ) : null}
          </div>
          {largeMemberList ? (
            <p className={`mt-1 text-xs text-amber-900/90 dark:text-amber-100/80`}>
              {activeMembers.length} thành viên — mở danh sách và gõ tối thiểu {FUND_CASH_MEMBER_SEARCH_MIN_CHARS} ký tự
              để tìm; cuộn trong khung (tối đa {FUND_CASH_MEMBER_MAX_VISIBLE} dòng mỗi lần).
            </p>
          ) : (
            <p className={`mt-1 text-xs ${t.type.muted}`}></p>
          )}

          {memberPickerOpen && memberDropdownLayout ? (
            <div
              className={`fixed z-[80] flex flex-col overflow-hidden rounded-xl border shadow-lg ${
                isDark
                  ? 'border-slate-600 bg-slate-900 text-slate-50 shadow-black/40'
                  : 'border-slate-200 bg-white text-slate-900 shadow-md'
              }`}
              style={{
                top: memberDropdownLayout.top,
                left: memberDropdownLayout.left,
                width: memberDropdownLayout.width,
                maxHeight: memberDropdownLayout.maxHeight,
              }}
              role="presentation"
            >
              <input
                ref={memberSearchInputRef}
                id={`${formId}-member-search`}
                type="search"
                autoComplete="off"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={
                  largeMemberList
                    ? `Gõ ít nhất ${FUND_CASH_MEMBER_SEARCH_MIN_CHARS} ký tự (tên, email, MSSV)…`
                    : 'Tìm theo tên, email, MSSV…'
                }
                disabled={isSubmitting || membersLoading}
                className={`shrink-0 w-full border-0 border-b border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500/40 dark:border-slate-600 ${
                  isDark ? 'bg-slate-900 text-slate-50 placeholder:text-slate-500' : 'bg-white text-slate-900 placeholder:text-slate-400'
                }`}
                aria-label="Tìm thành viên"
              />
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
                role="listbox"
                aria-label="Danh sách thành viên"
              >
                {membersLoading ? (
                  <p className={`p-3 text-sm ${t.type.muted}`}>Đang tải danh sách thành viên…</p>
                ) : largeMemberList && !searchGateOk ? (
                  <p className={`p-3 text-sm ${t.type.muted}`}>
                    Gõ ít nhất {FUND_CASH_MEMBER_SEARCH_MIN_CHARS} ký tự để hiển thị danh sách.
                  </p>
                ) : filteredMembers.length === 0 ? (
                  <p className={`p-3 text-sm ${t.type.muted}`}>
                    {searchChars > 0 ? 'Không có thành viên khớp tìm kiếm.' : 'Không có thành viên.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200 dark:divide-slate-600">
                    {filteredMembers.map((m) => {
                      const selected = contributorUserId === m.userId;
                      return (
                        <li key={m.userId}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setContributorUserId(m.userId);
                              setMemberPickerOpen(false);
                              setMemberSearch('');
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                              selected
                                ? 'bg-amber-100 dark:bg-amber-900/35 text-amber-950 dark:text-amber-100'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <span className="font-medium">{m.fullName}</span>
                            <span className={`block text-xs ${t.type.muted}`}>{m.email}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {listTruncated && filteredMembers.length > 0 ? (
                <p
                  className={`shrink-0 border-t px-3 py-2 text-xs ${t.type.muted} ${isDark ? 'border-slate-600' : 'border-slate-100'}`}
                >
                  Đang hiển thị {FUND_CASH_MEMBER_MAX_VISIBLE} kết quả đầu — gõ thêm để thu hẹp.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${t.type.body}`} htmlFor={`${formId}-amount`}>
            Số tiền
          </label>
          <input
            id={`${formId}-amount`}
            inputMode="numeric"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
            placeholder="Ví dụ: 50000"
            disabled={isSubmitting}
            className={`${t.input} w-full ${inputClass}`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${t.type.body}`} htmlFor={`${formId}-note`}>
            Ghi chú (Tuỳ chọn)
          </label>
          <textarea
            id={`${formId}-note`}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Tiền mặt buổi họp CLB 10/4"
            disabled={isSubmitting}
            maxLength={FUND_CASH_NOTE_MAX_LENGTH}
            className={`${t.input} w-full ${inputClass} resize-y min-h-[5rem]`}
          />
          <p className={`mt-1 text-xs ${t.type.muted}`}>
            Tối đa {FUND_CASH_NOTE_MAX_LENGTH} ký tự; nếu nhập thì tối thiểu {FUND_CASH_NOTE_MIN_LENGTH} ký tự (
            {note.trim().length} đã nhập)
          </p>
        </div>

        {categories.length > 0 ? (
          <div>
            <label className={`block text-sm font-medium mb-1 ${t.type.body}`} htmlFor={`${formId}-cat`}>
              Danh mục (tuỳ chọn)
            </label>
            <select
              id={`${formId}-cat`}
              value={categoryIdStr}
              onChange={(e) => setCategoryIdStr(e.target.value)}
              disabled={isSubmitting}
              className={`${t.input} w-full ${inputClass}`}
            >
              <option value="">— Không chọn —</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={String(c.categoryId)}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className={`block text-sm font-medium mb-1 ${t.type.body}`} htmlFor={`${formId}-when`}>
            Thời điểm nộp (Tuỳ chọn)
          </label>
          <input
            id={`${formId}-when`}
            type="datetime-local"
            value={contributedAtLocal}
            onChange={(e) => setContributedAtLocal(e.target.value)}
            disabled={isSubmitting}
            className={`${t.input} w-full ${inputClass}`}
          />
        </div>

        {lastSuccess ? (
          <div
            className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-900/15 px-4 py-3 text-sm"
            role="status"
          >
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">Ghi nhận gần nhất</p>
            <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/90">
              Mã giao dịch: <span className="font-mono">#{lastSuccess.transactionId}</span>
            </p>
            <p className="text-emerald-900/90 dark:text-emerald-100/90">
              Số dư quỹ mới:{' '}
              <span className="font-semibold tabular-nums">
                {lastSuccess.newCurrentBalance.toLocaleString('vi-VN')} ₫
              </span>
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || clientErrors.length > 0}
          className={`${t.btn.primary} inline-flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:pointer-events-none`}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden /> : null}
          Ghi nhận tiền mặt
        </button>
      </form>
    </div>
  );
}
