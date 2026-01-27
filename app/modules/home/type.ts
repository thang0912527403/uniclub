import type { Dayjs } from 'dayjs';
export interface ClubNewsCardProps {
  image: string;
  title: string;
  clubName: string;  
  category: string;
  date: string;
  views: number;
  likes: number;
  summary: string;
}
export interface NewsFilterProps {
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClubChange: (value: string) => void;
  onDateChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
}