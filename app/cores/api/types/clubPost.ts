export interface ClubPostResponseDto {
  postId: number;
  clubId: number;
  clubName: string;
  userId?: string | null;
  userName?: string | null;
  title: string;
  imageUrl?: string | null;
  caption?: string | null;
  content?: string | null;
  postDate: string;
  updatedAt: string;
  status: string;
}

export interface CreateClubPostDto {
  clubId: number;
  userId?: string | null;
  title: string;
  imageUrl?: string | null;
  caption?: string | null;
  content?: string | null;
  status?: string;
}
