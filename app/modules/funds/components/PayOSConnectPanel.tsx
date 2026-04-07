import { useEffect, useMemo, useState } from "react";
import { Loader2, PlugZap, Save } from "lucide-react";
import { useNotification } from "~/components/Notification";
import {
  useGetPayosGuideQuery,
  useGetPayosSettingsQuery,
  useUpdatePayosSettingsMutation,
  type ClubPayosGuide,
} from "~/cores/api";
import { fundTokens as t } from "~/routes/funds.design-tokens";

type Props = {
  clubId: number;
  /** Option 1: everyone sees guide, only Manager can configure */
  canManagePayos: boolean;
};

function resolveStatusLabel(guide: ClubPayosGuide | undefined) {
  const isConfigured = guide?.payos?.isConfigured === true;
  const isEnabled = guide?.payos?.isEnabled === true;
  if (!isConfigured) return { label: "Chưa kết nối", cls: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200" };
  if (isConfigured && !isEnabled) return { label: "Đã tắt", cls: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" };
  return { label: "Đã kết nối", cls: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" };
}

export function PayOSConnectPanel({ clubId, canManagePayos }: Props) {
  const { show: showNotification } = useNotification();

  const {
    data: guide,
    isLoading: isLoadingGuide,
    isError: isGuideError,
  } = useGetPayosGuideQuery(clubId, { skip: !clubId });

  const {
    data: settings,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
    error: settingsError,
  } = useGetPayosSettingsQuery(clubId, { skip: !clubId || !canManagePayos });

  const [updateSettings, { isLoading: isSaving }] = useUpdatePayosSettingsMutation();

  const status = useMemo(() => resolveStatusLabel(guide), [guide]);

  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [checksumKey, setChecksumKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Masked fields are informational only; new secrets must be re-entered intentionally.
    setClientId(String(settings?.clientId ?? "").trim());
    setApiKey("");
    setChecksumKey("");
    setIsEnabled(settings?.isEnabled ?? true);
  }, [settings?.clientId, settings?.isEnabled]);

  const manager403 =
    isSettingsError &&
    settingsError &&
    typeof settingsError === "object" &&
    "status" in settingsError &&
    (settingsError as { status: number }).status === 403;

  return (
    <section className={`${t.card.base} overflow-hidden`} aria-labelledby="payos-heading">
      <div className={`px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm" aria-hidden>
              <PlugZap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="payos-heading" className={t.type.sectionTitle}>
                Kết nối PayOS
              </h2>
              <p className={t.type.body}>
                Hướng dẫn kết nối PayOS cho Quản Lý CLB.
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${status.cls}`}>
            {isLoadingGuide ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null}
            {status.label}
          </span>
        </div>
      </div>

      <div className={`${t.space.card} ${t.space.section}`}>
        {isGuideError ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 text-sm" role="alert">
            Không tải được hướng dẫn PayOS. Vui lòng thử lại.
          </div>
        ) : (
          <>
            <div>
              <p className={`${t.type.label} mb-2`}>Các bước kết nối</p>
              <ul className="space-y-2">
                {(guide?.stepsVi ?? []).map((step, idx) => (
                  <li key={`${idx}-${step}`} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input type="checkbox" className="mt-1" aria-label={`Bước ${idx + 1}`} readOnly />
                    <span className="whitespace-pre-line">{step}</span>
                  </li>
                ))}
                {!isLoadingGuide && (guide?.stepsVi?.length ?? 0) === 0 ? (
                  <li className={t.type.muted}>Chưa có hướng dẫn.</li>
                ) : null}
              </ul>
            </div>
          </>
        )}

        {!canManagePayos ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
              Chỉ Club Manager mới có quyền cấu hình PayOS.
            </p>
            <p className={t.type.muted}>
              Nếu bạn cần bật/tắt hoặc cập nhật key, vui lòng liên hệ Club Manager.
            </p>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!clubId) return;
              try {
                await updateSettings({
                  clubId,
                  clientId: clientId.trim(),
                  apiKey: apiKey.trim(),
                  checksumKey: checksumKey.trim(),
                  isEnabled,
                }).unwrap();
                showNotification({
                  type: "success",
                  title: "Đã lưu",
                  message: "Cấu hình PayOS đã được cập nhật.",
                });
              } catch (err: unknown) {
                const st =
                  typeof err === "object" && err && "status" in err
                    ? (err as { status: number }).status
                    : undefined;
                if (st === 403) {
                  showNotification({
                    type: "error",
                    title: "Không có quyền",
                    message: "Chỉ Club Manager mới có quyền kết nối/cập nhật PayOS.",
                  });
                  return;
                }
                const msg =
                  (err as { data?: { message?: string; error?: string } })?.data?.message ??
                  (err as { data?: { message?: string; error?: string } })?.data?.error ??
                  (err as Error)?.message ??
                  "Không thể lưu cấu hình PayOS.";
                showNotification({ type: "error", title: "Lỗi", message: String(msg) });
              }
            }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {manager403 ? (
              <div className="lg:col-span-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-100 text-sm">
                Bạn không có quyền xem cấu hình PayOS của CLB này.
              </div>
            ) : null}

            <div>
              <label className={`block ${t.type.label} mb-1.5`} htmlFor="payos-client-id">
                Client ID
              </label>
              <input
                id="payos-client-id"
                className={t.input}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Nhập Client ID"
                autoComplete="off"
              />
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="flex-1">
                <label className={`block ${t.type.label} mb-1.5`} htmlFor="payos-enabled">
                  Trạng thái
                </label>
                <button
                  id="payos-enabled"
                  type="button"
                  onClick={() => setIsEnabled((v) => !v)}
                  className={`${t.btn.secondary} w-full justify-center`}
                  disabled={isSaving}
                >
                  {isEnabled ? "Đang bật" : "Đang tắt"}
                </button>
              </div>
            </div>

            <div>
              <label className={`block ${t.type.label} mb-1.5`} htmlFor="payos-api-key">
                API Key
              </label>
              <input
                id="payos-api-key"
                className={t.input}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.apiKeyMasked?.trim() ? settings.apiKeyMasked : "Nhập API Key"}
                autoComplete="off"
              />
            </div>

            <div>
              <label className={`block ${t.type.label} mb-1.5`} htmlFor="payos-checksum">
                Checksum Key
              </label>
              <input
                id="payos-checksum"
                className={t.input}
                value={checksumKey}
                onChange={(e) => setChecksumKey(e.target.value)}
                placeholder={settings?.checksumKeyMasked?.trim() ? settings.checksumKeyMasked : "Nhập Checksum Key"}
                autoComplete="off"
              />
            </div>

            <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <p className={t.type.muted}>
                {isLoadingSettings ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Đang tải cấu hình...
                  </span>
                ) : null}
              </p>
              <button
                type="submit"
                className={`${t.btn.cta} inline-flex items-center gap-2`}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
                Lưu
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

