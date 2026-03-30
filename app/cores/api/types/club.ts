export interface Club {
  address: string;
  clubId: number;
  clubName: string;
  coverImageUrl: string;
  createdAt: string;
  description: string;
  email: string;
  facebookUrl: string;
  foundedDate: string;
  isActive: boolean;
  isDeleted: boolean;
  isPublic: boolean;
  logoUrl: string;
  memberCount: number;
  phoneNumber: string
  shortName: string;
  status: "Active" | "Inactive";
  updatedAt: string;
  websiteUrl: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  totalPages: number;
  totalCount: number;
  message?: string;
}

