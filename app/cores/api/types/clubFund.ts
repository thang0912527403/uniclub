export type ClubFundStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
}

export interface ApproveFundDto {
  fundId: number;
  action: 'APPROVE' | 'REJECT';
}

export type FundTransactionType = 'INCOME' | 'EXPENSE';

export interface CreateFundRequestDto {
  fundId: number;
  transactionType: FundTransactionType;
  amount: number;
  description: string;
  purpose?: string;
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
}

export interface CreateFundRequestResponse {
  transactionId: number;
  message?: string;
}

export type FundHistoryScope = 'all' | 'contributions' | 'mine';

export interface FundHistoryItem {
  transactionId?: number;
  id?: number;
  fundId: number;
  amount: number;
  status: string;
  description?: string;
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

export interface CreateFundDto {
  fundName: string;
  initialAmount: number;
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
