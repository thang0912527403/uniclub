export type ClubFundStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
export type FundListStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
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
  hasViewFinancePolicy: boolean;
  hasCreateFinancePolicy: boolean;
  hasEditFinancePolicy: boolean;
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

export interface CreateFundDto {
  fundName: string;
  description?: string;
  expiresAt?: string;
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

export interface ClubPayosGuide {
  payos: {
    isConfigured: boolean;
    isEnabled: boolean;
    noteVi?: string;
  };
  stepsVi: string[];
}

export interface ClubPayosSettings {
  clientId?: string | null;
  apiKeyMasked?: string | null;
  checksumKeyMasked?: string | null;
  isEnabled: boolean;
}

export interface UpdateClubPayosSettingsDto {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  isEnabled: boolean;
}
