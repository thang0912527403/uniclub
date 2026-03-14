/** Trạng thái quỹ: PENDING (chờ Manager duyệt), APPROVED, REJECTED */
export type ClubFundStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Fund model - trả về từ GET /ClubFund/{fundId} và GET /ClubFund/club/{clubId} */
export interface ClubFund {
  fundId: number;
  clubId: number;
  fundName?: string;
  balance?: number;
  description?: string;
  /** Trạng thái duyệt quỹ. Chỉ quỹ APPROVED mới được tạo yêu cầu THU/CHI. */
  status?: ClubFundStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Body cho POST /ClubFund/approve – chỉ Manager mới gọi được */
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

export interface ProcessFundRequestDto {
  requestId: number;
  approved: boolean;
  note?: string;
}

export interface CreateFundRequestResponse {
  transactionId: number;
  message?: string;
}

export interface FundHistoryItem {
  id: number;
  fundId: number;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  requestedBy?: string;
  processedBy?: string;
}
