export interface Club {
  id: string;
  name: string;
  description: string;
  logo?: string;
  memberCount: number;
  createdAt: string;
}

export interface CreateClubRequest {
  name: string;
  description: string;
  logo?: string;
}
