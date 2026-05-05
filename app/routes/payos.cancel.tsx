import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  clearPayosPendingContribute,
  readPayosPendingContribute,
} from "~/modules/funds/utils/payosContributeSession";
import { ClubFundDetailLink } from '~/modules/funds/components/ClubFundDetailLink';

export default function PayosCancelPage() {
  const navigate = useNavigate();

  const [ctx] = useState(() => readPayosPendingContribute());

  const fundCtx =
    ctx && ctx.clubId > 0 && ctx.fundId != null && ctx.fundId > 0
      ? { clubId: ctx.clubId, fundId: ctx.fundId }
      : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1729] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Thanh toán chưa hoàn tất</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Bạn đã hủy hoặc thoát khỏi trang thanh toán PayOS. Giao dịch nộp quỹ không được coi là thành công cho đến khi thanh toán xong và hệ thống xác nhận.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {fundCtx ? (
            <ClubFundDetailLink
              clubId={fundCtx.clubId}
              fundId={fundCtx.fundId}
              afterSelect={() => clearPayosPendingContribute()}
              className="inline-flex justify-center items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Quay lại chi tiết quỹ
            </ClubFundDetailLink>
          ) : (
            <Link
              to="/funds"
              onClick={() => clearPayosPendingContribute()}
              className="inline-flex justify-center items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Quay lại danh sách quỹ
            </Link>
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex justify-center items-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Quay lại trang trước
          </button>
        </div>
      </div>
    </div>
  );
}
