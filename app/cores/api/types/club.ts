export interface Club {
  clubId: number;
  clubName: string;
  description: string;
  category: string;
  memberCount: number;
  imageUrl: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
