export type ClubFundStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type FundClosedReasonCode = 'EXPIRED' | 'MANAGER_CLOSED';

export type FundLifecycleFilter = 'ALL' | 'OPEN' | 'CLOSED' | 'EXPIRED' | 'MANAGER_CLOSED';

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ClubFund {
  fundId: number;
  clubId: number;
  fundName?: string;
  fundTypeId?: number | null;
  fundTypeName?: string | null;
  goalAmount?: number | null;
  currentBalance?: number;
  totalAmount?: number;
  balance?: number;
  description?: string;
  status?: ClubFundStatus;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string | null;
  canAcceptContributions?: boolean;
  balanceContextVi?: string | null;
  cannotContributeReasonVi?: string | null;
  rejectionReasonVi?: string | null;
  expiresAtUtcNoteVi?: string | null;
  /** Quỹ đã “đóng” theo lifecycle (hết hạn nộp hoặc soft-delete). */
  isClosed?: boolean;
  /** Quỹ soft-delete; chỉ có trong list/chi tiết khi user đủ quyền (BE). */
  isDeleted?: boolean;
  closedReasonCode?: FundClosedReasonCode | null;
  lifecycleStatusVi?: string | null;
}

export type MyFundsPagedResult = PagedResult<ClubFund> & {
  usedMyFundsFallback?: boolean;
};

export interface ApproveFundDto {
  fundId: number;
  action: 'APPROVE' | 'REJECT';
  rejectReason?: string;
}

export type FundTransactionType = 'INCOME' | 'EXPENSE';

export interface CreateFundRequestDto {
  fundId: number;
  transactionType: FundTransactionType;
  amount: number;
  description: string;
  purpose?: string;
}

export type FundSidebarMenuId = 'overview' | 'transactions' | 'reports' | 'settings';
/** Trạng thái workflow trên API (không gồm “Đã đóng” lifecycle). */
export type FundListWorkflowStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
/** Bộ lọc UI: workflow + “Đã đóng” (map sang query `lifecycle=CLOSED`). */
export type FundListStatus = FundListWorkflowStatus | 'CLOSED';
export type FundListSort = 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC';
export type FundMineType = 'ALL' | 'CREATED' | 'RESPONSIBLE';

export interface FundMenuItemDto {
  id: FundSidebarMenuId;
  labelVi: string;
  labelEn: string;
  visible: boolean;
}

export interface ClubFundCapabilities {
  canViewFunds: boolean;
  canContribute: boolean;
  canCreateFund: boolean;
  canApproveOrRejectFundEntity: boolean;
  canManageOnlinePaymentSettings: boolean;
  canRecordCashContributions: boolean;
  canProcessClubRefunds: boolean;
  hasViewFinancePolicy: boolean;
  hasCreateFinancePolicy: boolean;
  hasEditFinancePolicy: boolean;
  hasDeleteFinancePolicy: boolean;
  canSoftDeleteFund: boolean;
  /** Xem cả quỹ soft-deleted trong list/chi tiết (manager + editfinance / admin). */
  canViewSoftDeletedFunds: boolean;
  clubRoleName?: string | null;
  clubRoleLevel?: number | null;
  isActiveClubMember: boolean;
  menuItems: FundMenuItemDto[];
  financeAccessHintVi?: string | null;
}

export interface FundReportSummaryDto {
  clubId: number;
  fromUtc?: string | null;
  toUtc?: string | null;
  pendingFundCount: number;
  approvedFundCount: number;
  rejectedFundCount: number;
  totalBalanceApprovedFunds: number;
  totalApprovedIncome: number;
  totalApprovedExpense: number;
  dateFilterNoteVi?: string | null;
}

export interface CreateFundRequestResponse {
  transactionId: number;
  message?: string;
}

export type FundHistoryScope = 'all' | 'contributions' | 'mine';
export type FundHistoryStatusFilter = '' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
export type FundHistoryScopeFilter = '' | 'mine';

export interface FundCategoryResponseDto {
  categoryId: number;
  categoryName: string;
  description?: string | null;
  clubId?: number | null;
}

export interface GetClubFundTransactionsParams {
  clubId: number;
  page?: number;
  pageSize?: number;
  fundId?: number;
  status?: string;
  scope?: FundHistoryScopeFilter;
  fromUtc?: string | null;
  toUtc?: string | null;
}

export interface GetMyFundsParams {
  clubId: number;
  mineType?: FundMineType;
  status?: FundListStatus;
  search?: string;
  sort?: FundListSort;
  page?: number;
  pageSize?: number;
}

export type FundRefundStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface FundRefundRequestResponseDto {
  refundRequestId: number;
  clubId: number;
  fundId: number;
  originalTransactionId: number;
  requestedBy: string;
  amount: number;
  reason?: string | null;
  bankName: string;
  bankAccountNumber: string;
  accountHolderName: string;
  status: FundRefundStatus | string;
  createdAtUtc: string;
  updatedAtUtc: string;
  completedAtUtc?: string | null;
  completedBy?: string | null;
  rejectedAtUtc?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  transferReference?: string | null;
  managerNote?: string | null;
  fundName?: string | null;
}

export interface CreateFundRefundRequestDto {
  originalTransactionId: number;
  amount: number;
  reason?: string;
  bankName: string;
  bankAccountNumber: string;
  accountHolderName: string;
}

export interface CompleteFundRefundRequestDto {
  transferReference?: string;
  managerNote?: string;
}

export interface RejectFundRefundRequestDto {
  rejectionReason: string;
}

export type FundRefundQueueStatusFilter =
  | 'PENDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ALL';

export interface GetClubFundRefundRequestsParams {
  clubId: number;
  page?: number;
  pageSize?: number;
  status?: FundRefundQueueStatusFilter;
}

export interface FundHistoryItem {
  transactionId?: number;
  id?: number;
  fundId: number;
  fundName?: string | null;
  amount: number;
  status: string;
  description?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  transactionDate?: string;
  requestedBy?: string;
  processedBy?: string;
  memberName?: string;
  userName?: string;
  userFullName?: string;
  contributorName?: string;
  senderName?: string;
  createdByName?: string;
  isMemberContribution?: boolean;
  transactionType?: string;
  refundForTransactionId?: number;
  contributionSource?: string | null;
  paymentProvider?: string | null;
}

export interface FundHistoryResponse {
  items: FundHistoryItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** Phản hồi DELETE `/clubs/{clubId}/funds/{fundId}` (đóng quỹ — xóa mềm phía server). */
export interface SoftDeleteFundResponse {
  message?: string;
}

export interface CreateFundDto {
  fundName: string;
  description?: string;
  expiresAt?: string;
  fundTypeId: number;
  goalAmount?: number;
}

export interface ContributeToFundDto {
  fundId: number;
  amount: number;
  categoryId?: number;
  description?: string;
}

export interface ContributeToFundResponse {
  transactionId: number;
  checkoutUrl?: string;
  qrCode?: string;
  paymentLinkId?: string;
  amount?: number;
  paymentLinkExpiresAtUtc?: string;
  message?: string;
}

export interface RecordCashContributionRequest {
  fundId: number;
  contributorUserId: string;
  amount: number;
  note: string;
  categoryId?: number;
  contributedAtUtc?: string;
}

export interface RecordCashContributionResponse {
  transactionId: number;
  fundId: number;
  amount: number;
  status: string;
  contributionSource: string;
  newCurrentBalance: number;
  contributorUserId: string;
  recordedByUserId: string;
}

export interface CreateManagerRefundDto {
  originalTransactionId: number;
  amount: number;
  reason?: string;
  transferReference?: string;
  managerNote?: string;
}

export interface FundContributeTransactionStatus {
  transactionId: number;
  fundId: number;
  status?: string;
  amount?: number;
  isPaid: boolean;
  isPaymentLinkExpired: boolean;
  paymentLinkExpiresAtUtc?: string | null;
  message?: string;
}

export interface PayosFundContributionReturn {
  clubId: number;
  fundId: number;
  isPaid: boolean;
  message?: string;
}

export type PaymentCredentialInputType = 'text' | 'password';

export type PaymentCredentialFieldName = 'clientId' | 'apiKey' | 'checksumKey';

export interface PaymentCredentialFieldSchema {
  name: PaymentCredentialFieldName;
  labelVi: string;
  requiredWhenEnabled: boolean;
  maxLength: number;
  inputType: PaymentCredentialInputType;
  helpTextVi?: string;
}

export interface OnlinePaymentProviderOption {
  code: string;
  labelVi: string;
  credentialFields: PaymentCredentialFieldSchema[];
}

export interface ClubPayosGuide {
  clubId?: number;
  paymentCredentialSchemaVersion: number;
  onlinePaymentProviders: OnlinePaymentProviderOption[];
  payos: {
    isConfigured: boolean;
    isEnabled: boolean;
    noteVi?: string;
  };
  stepsVi: string[];
}

export interface ClubPayosSettings {
  clubId?: number;
  paymentProvider: string;
  isConfigured: boolean;
  clientId?: string | null;
  apiKeyMasked?: string | null;
  checksumKeyMasked?: string | null;
  isEnabled: boolean;
  updatedAtUtc?: string | null;
}

export interface UpdateClubPayosSettingsDto {
  paymentProvider?: string | null;
  clientId: string;
  apiKey: string;
  checksumKey: string;
  isEnabled: boolean;
}

export interface FundTypeDto {
  fundTypeId: number;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface FundMemberContributionMemberDto {
  userId: string;
  fullName: string;
  email: string;
  status: string;
  paidAmount: number;
  requiredAmount?: number | null;
  remainingAmount?: number | null;
  isPaidEnough?: boolean | null;
}

export interface FundMemberContributionsDto {
  clubId: number;
  fundId: number;
  fundName: string;
  fundTypeId?: number | null;
  fundTypeName?: string | null;
  goalAmount?: number | null;
  activeMemberCount: number;
  requiredPerMember?: number | null;
  totalApprovedMemberContributions: number;
  members: FundMemberContributionMemberDto[];
}
