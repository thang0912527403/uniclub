/** DTO for creating a fund request (POST api/ClubFund/request) */
export interface CreateFundRequestDto {
  fundId: number;
  amount: number;
  description: string;
  purpose?: string;
}

/** DTO for processing a fund request (POST api/ClubFund/process) */
export interface ProcessFundRequestDto {
  requestId: number;
  approved: boolean;
  note?: string;
}

/** Single item in fund history (GET api/ClubFund/history/{fundId}) */
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
