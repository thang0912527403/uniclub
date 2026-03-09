/** Fund model - trả về từ GET /ClubFund/{fundId} và GET /ClubFund/club/{clubId} */
export interface ClubFund {
  fundId: number;
  clubId: number;
  fundName?: string;
  balance?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFundRequestDto {
  fundId: number;
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
