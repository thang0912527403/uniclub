import { useEffect, useMemo, useState } from "react";
import { Loader2, PlugZap, Save } from "lucide-react";
import { useNotification } from "~/components/Notification";
import { useClubRole } from "~/hooks/useClubRole";
import {
  useGetPayosGuideQuery,
  useGetPayosSettingsQuery,
  useUpdatePayosSettingsMutation,
  type ClubPayosGuide,
  type ClubPayosSettings,
  type OnlinePaymentProviderOption,
  type PaymentCredentialFieldSchema,
  type PaymentCredentialFieldName,
} from "~/cores/api";
import { fundTokens as t } from "~/routes/funds.design-tokens";

const PAYMENT_PROVIDER_MAX_LEN = 32;
const FE_SUPPORTED_PAYMENT_CREDENTIAL_SCHEMA_VERSION = 1;

const EMPTY_CREDENTIALS: Record<"clientId" | "apiKey" | "checksumKey", string> = {
  clientId: "",
  apiKey: "",
  checksumKey: "",
};

const DEFAULT_CREDENTIAL_FIELDS: PaymentCredentialFieldSchema[] = [
  {
    name: "clientId",
    labelVi: "Client ID",
    requiredWhenEnabled: true,
    maxLength: 100,
    inputType: "text",
  },
  {
    name: "apiKey",
    labelVi: "API Key",
    requiredWhenEnabled: true,
    maxLength: 200,
    inputType: "password",
  },
  {
    name: "checksumKey",
    labelVi: "Checksum Key",
    requiredWhenEnabled: true,
    maxLength: 200,
    inputType: "password",
  },
];

type Props = {
  clubId: number;
  canManagePayos: boolean;
};

function normalizeProviderCode(code: string): string {
  return code.trim().toUpperCase().slice(0, PAYMENT_PROVIDER_MAX_LEN) || "PAYOS";
}

function credentialFieldsForProvider(
  provider: OnlinePaymentProviderOption | undefined,
): PaymentCredentialFieldSchema[] {
  const list = provider?.credentialFields;
  if (Array.isArray(list) && list.length > 0) return list;
  return DEFAULT_CREDENTIAL_FIELDS;
}

function maskedPlaceholder(
  fieldName: PaymentCredentialFieldName,
  selectedProvider: string,
  settings: ClubPayosSettings | undefined,
): string | undefined {
  if (
    !settings ||
    normalizeProviderCode(settings.paymentProvider) !==
      normalizeProviderCode(selectedProvider)
  ) {
    return undefined;
  }
  if (fieldName === "apiKey" && settings.apiKeyMasked?.trim())
    return settings.apiKeyMasked;
  if (fieldName === "checksumKey" && settings.checksumKeyMasked?.trim())
    return settings.checksumKeyMasked;
  return undefined;
}

function validateCredentialForm(
  fields: PaymentCredentialFieldSchema[],
  values: Record<"clientId" | "apiKey" | "checksumKey", string>,
  isEnabled: boolean,
  settings: ClubPayosSettings | undefined,
  selectedProvider: string,
): string | null {
  if (!isEnabled) return null;
  const sameSavedProvider =
    !!settings &&
    normalizeProviderCode(settings.paymentProvider) ===
      normalizeProviderCode(selectedProvider);
  for (const f of fields) {
    if (!f.requiredWhenEnabled) continue;
    const v = (values[f.name] ?? "").trim();
    if (v.length > 0) continue;
    if (f.inputType === "password" && sameSavedProvider) {
      const masked = maskedPlaceholder(f.name, selectedProvider, settings);
      if (masked?.trim()) continue;
    }
    return `Vui lòng nhập ${f.labelVi}.`;
  }
  return null;
}

function resolveStatusLabel(
  guide: ClubPayosGuide | undefined,
  settings: ClubPayosSettings | undefined,
  canManagePayos: boolean,
) {
  if (canManagePayos && settings) {
    const isConfigured = settings.isConfigured === true;
    const isEnabled = settings.isEnabled === true;
    if (!isConfigured)
      return {
        label: "Chưa kết nối",
        cls: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
      };
    if (isConfigured && !isEnabled)
      return {
        label: "Đã tắt",
        cls: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
      };
    return {
      label: "Đã kết nối",
      cls: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    };
  }
  const isConfigured = guide?.payos?.isConfigured === true;
  const isEnabled = guide?.payos?.isEnabled === true;
  if (!isConfigured)
    return {
      label: "Chưa kết nối",
      cls: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
    };
  if (isConfigured && !isEnabled)
    return {
      label: "Đã tắt",
      cls: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    };
  return {
    label: "Đã kết nối",
    cls: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  };
}

function mergeProviderOptions(
  guideProviders: OnlinePaymentProviderOption[] | undefined,
  settingsCode: string | undefined,
): OnlinePaymentProviderOption[] {
  const map = new Map<string, OnlinePaymentProviderOption>();
  for (const p of guideProviders ?? []) {
    if (p.code)
      map.set(normalizeProviderCode(p.code), {
        ...p,
        code: normalizeProviderCode(p.code),
      });
  }
  const extra = normalizeProviderCode(String(settingsCode ?? ""));
  if (extra && !map.has(extra)) {
    map.set(extra, { code: extra, labelVi: extra, credentialFields: [] });
  }
  return [...map.values()];
}

export function PayOSConnectPanel({ clubId, canManagePayos }: Props) {
  const { show: showNotification } = useNotification();
  const { can } = useClubRole();
  const canSavePayosSettings = can("editfinance");

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

  const [updateSettings, { isLoading: isSaving }] =
    useUpdatePayosSettingsMutation();

  const status = useMemo(
    () => resolveStatusLabel(guide, settings, canManagePayos),
    [guide, settings, canManagePayos],
  );

  const providerOptions = useMemo(
    () =>
      mergeProviderOptions(guide?.onlinePaymentProviders, settings?.paymentProvider),
    [guide?.onlinePaymentProviders, settings?.paymentProvider],
  );

  const schemaVersion = guide?.paymentCredentialSchemaVersion ?? 1;
  const schemaUnsupported =
    schemaVersion > FE_SUPPORTED_PAYMENT_CREDENTIAL_SCHEMA_VERSION;

  const [paymentProvider, setPaymentProvider] = useState("PAYOS");
  const [credentialValues, setCredentialValues] = useState(EMPTY_CREDENTIALS);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    setCredentialValues({ ...EMPTY_CREDENTIALS });
    setPaymentProvider("PAYOS");
    setIsEnabled(true);
  }, [clubId]);

  useEffect(() => {
    if (!canManagePayos || !settings) return;
    setPaymentProvider(
      normalizeProviderCode(String(settings.paymentProvider ?? "PAYOS")),
    );
    setIsEnabled(settings.isEnabled ?? true);
    setCredentialValues({
      clientId: String(settings.clientId ?? "").trim(),
      apiKey: "",
      checksumKey: "",
    });
  }, [canManagePayos, settings?.clientId, settings?.paymentProvider, settings?.isEnabled]);

  useEffect(() => {
    if (!canManagePayos || providerOptions.length === 0) return;
    setPaymentProvider((prev) => {
      const n = normalizeProviderCode(prev);
      return providerOptions.some((p) => p.code === n) ? n : providerOptions[0].code;
    });
  }, [canManagePayos, providerOptions]);

  const selectedProvider = useMemo(
    () => providerOptions.find((p) => p.code === paymentProvider),
    [providerOptions, paymentProvider],
  );

  const activeCredentialFields = useMemo(
    () => credentialFieldsForProvider(selectedProvider),
    [selectedProvider],
  );

  const handleProviderSelectChange = (raw: string) => {
    const next = normalizeProviderCode(raw);
    setPaymentProvider(next);
    if (settings && next === normalizeProviderCode(settings.paymentProvider)) {
      setCredentialValues({
        clientId: String(settings.clientId ?? "").trim(),
        apiKey: "",
        checksumKey: "",
      });
    } else {
      setCredentialValues({ ...EMPTY_CREDENTIALS });
      if (settings && next !== normalizeProviderCode(settings.paymentProvider)) {
        showNotification({
          type: "info",
          title: "Đã đổi cổng",
          message: "Nhập lại thông tin kết nối cho cổng vừa chọn.",
        });
      }
    }
  };

  const manager403 =
    isSettingsError &&
    settingsError &&
    typeof settingsError === "object" &&
    "status" in settingsError &&
    (settingsError as { status: number }).status === 403;

  const selectValue = providerOptions.some((p) => p.code === paymentProvider)
    ? paymentProvider
    : providerOptions[0]?.code ?? "PAYOS";

  return (
    <section
      className={`${t.card.base} overflow-hidden`}
      aria-labelledby="club-fund-payment-heading"
    >
      <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm"
              aria-hidden
            >
              <PlugZap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="club-fund-payment-heading" className={t.type.sectionTitle}>
                Thanh toán online
              </h2>
              <p className={t.type.body}>Chọn cổng thanh toán và cấu hình kết nối.</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${status.cls}`}
          >
            {isLoadingGuide || (canManagePayos && isLoadingSettings) ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
            ) : null}
            {status.label}
          </span>
        </div>
      </div>

      <div className={`${t.space.card} ${t.space.section}`}>
        {isGuideError ? (
          <div
            className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 text-sm"
            role="alert"
          >
            Không tải được hướng dẫn thanh toán online. Vui lòng thử lại.
          </div>
        ) : (
          <>
            {guide && schemaUnsupported ? (
              <div
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/25 text-amber-900 dark:text-amber-100 text-sm border border-amber-200 dark:border-amber-800"
                role="alert"
              >
                <p className="font-medium">
                  Phiên bản mẫu cấu hình thanh toán mới (v{schemaVersion})
                </p>
                <p className="mt-1 opacity-90">
                  Ứng dụng hiện hỗ trợ tối đa v
                  {FE_SUPPORTED_PAYMENT_CREDENTIAL_SCHEMA_VERSION}. Vui lòng cập
                  nhật UniClub hoặc liên hệ hỗ trợ để tránh thiếu trường hoặc
                  sai luồng lưu cấu hình.
                </p>
              </div>
            ) : null}

            {(guide?.onlinePaymentProviders?.length ?? 0) > 0 ? (
              <div>
                <p className={`${t.type.label} mb-2`}>
                  Cổng thanh toán trực tuyến đang được hỗ trợ
                </p>
                <ul className="flex flex-wrap gap-2" aria-label="Danh sách cổng thanh toán">
                  {(guide?.onlinePaymentProviders ?? []).map((p) => (
                    <li
                      key={p.code}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {p.labelVi}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}

        {!canManagePayos ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
              Chỉ Quản lý CLB mới có quyền cấu hình cổng thanh toán.
            </p>
            <p className={t.type.muted}>
              Nếu bạn cần bật/tắt hoặc cập nhật kết nối, vui lòng liên hệ Quản lý
              CLB.
            </p>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!clubId) return;
              if (!canSavePayosSettings) {
                showNotification({
                  type: "error",
                  title: "Không có quyền",
                  message: "Bạn không có quyền cập nhật cấu hình thanh toán.",
                });
                return;
              }
              if (schemaUnsupported) {
                showNotification({
                  type: "error",
                  title: "Không thể lưu",
                  message:
                    "Phiên bản mẫu cấu hình chưa được app hỗ trợ. Vui lòng cập nhật ứng dụng.",
                });
                return;
              }
              const code = normalizeProviderCode(paymentProvider);
              const fields = credentialFieldsForProvider(selectedProvider);
              const err = validateCredentialForm(
                fields,
                credentialValues,
                isEnabled,
                settings,
                code,
              );
              if (err) {
                showNotification({ type: "error", title: "Thiếu thông tin", message: err });
                return;
              }
              const clientId = credentialValues.clientId.trim().slice(0, 100);
              const apiKey = credentialValues.apiKey.trim().slice(0, 200);
              const checksumKey = credentialValues.checksumKey.trim().slice(0, 200);
              try {
                await updateSettings({
                  clubId,
                  paymentProvider: code === "PAYOS" ? undefined : code,
                  clientId,
                  apiKey,
                  checksumKey,
                  isEnabled,
                }).unwrap();
                showNotification({
                  type: "success",
                  title: "Đã lưu",
                  message: "Cấu hình thanh toán online đã được cập nhật.",
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
                    message:
                      "Chỉ Club Manager mới có quyền cập nhật cấu hình thanh toán.",
                  });
                  return;
                }
                const msg =
                  (err as { data?: { message?: string; error?: string } })?.data
                    ?.message ??
                  (err as { data?: { message?: string; error?: string } })?.data
                    ?.error ??
                  (err as Error)?.message ??
                  "Không thể lưu cấu hình thanh toán.";
                showNotification({ type: "error", title: "Lỗi", message: String(msg) });
              }
            }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {manager403 ? (
              <div className="lg:col-span-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-100 text-sm">
                Bạn không có quyền xem cấu hình thanh toán của CLB này.
              </div>
            ) : null}

            <div className="lg:col-span-2">
              <label className="sr-only" htmlFor="club-payment-provider">
                Cổng thanh toán
              </label>
              <select
                id="club-payment-provider"
                className={t.input}
                value={selectValue}
                onChange={(e) => handleProviderSelectChange(e.target.value)}
                disabled={
                  isSaving ||
                  isLoadingSettings ||
                  providerOptions.length === 0 ||
                  schemaUnsupported
                }
              >
                {providerOptions.length === 0 ? (
                  <option value="PAYOS">PAYOS</option>
                ) : (
                  providerOptions.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.labelVi}
                    </option>
                  ))
                )}
              </select>
            </div>

            {activeCredentialFields.map((field) => {
              const id = `cred-${field.name}-${paymentProvider}`;
              const masked = maskedPlaceholder(field.name, paymentProvider, settings);
              const placeholder =
                field.inputType === "password" && masked?.trim()
                  ? masked
                  : `Nhập ${field.labelVi}`;
              return (
                <div key={`${paymentProvider}-${field.name}`} className="min-w-0">
                  <label className={`block ${t.type.label} mb-1.5`} htmlFor={id}>
                    {field.labelVi}
                    {field.requiredWhenEnabled ? (
                      <span className="text-red-600 dark:text-red-400 font-normal">
                        {" "}
                        *
                      </span>
                    ) : null}
                  </label>
                  <input
                    id={id}
                    name={field.name}
                    type={field.inputType === "password" ? "password" : "text"}
                    className={t.input}
                    value={credentialValues[field.name]}
                    maxLength={field.maxLength}
                    onChange={(e) =>
                      setCredentialValues((prev) => ({
                        ...prev,
                        [field.name]: e.target.value.slice(0, field.maxLength),
                      }))
                    }
                    placeholder={placeholder}
                    autoComplete="off"
                    disabled={isSaving || schemaUnsupported}
                  />
                  {field.helpTextVi?.trim() ? (
                    <p className={`mt-1 text-xs ${t.type.muted} whitespace-pre-line`}>
                      {field.helpTextVi.trim()}
                    </p>
                  ) : null}
                </div>
              );
            })}

            <div className="min-w-0">
              <label className={`block ${t.type.label} mb-1.5`} htmlFor="payos-enabled">
                Trạng thái
              </label>
              <button
                id="payos-enabled"
                type="button"
                onClick={() => setIsEnabled((v) => !v)}
                className={`${t.btn.secondary} w-full justify-center`}
                disabled={isSaving || schemaUnsupported}
              >
                {isEnabled ? "Đang bật" : "Đang tắt"}
              </button>
            </div>

            <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <p className={t.type.muted}>
                {isLoadingSettings ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Đang
                    tải cấu hình...
                  </span>
                ) : settings?.updatedAtUtc ? (
                  <>Cập nhật lần cuối: {settings.updatedAtUtc}</>
                ) : null}
              </p>
              {canSavePayosSettings && (
                <button
                  type="submit"
                  className={`${t.btn.cta} inline-flex items-center gap-2`}
                  disabled={isSaving || schemaUnsupported}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="w-4 h-4" aria-hidden />
                  )}
                  Lưu
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

