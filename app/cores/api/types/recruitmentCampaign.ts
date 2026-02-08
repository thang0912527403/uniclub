export interface RecruitmentCampaign {
  campaignId: number;
  clubId: number;
  campaignName: string;
  linkCampaign: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  imageUrl: string;
  content: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
