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
