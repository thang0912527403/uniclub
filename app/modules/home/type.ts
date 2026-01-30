import type { Dayjs } from 'dayjs';
// type.ts - Thêm vào cuối file
export interface ClubCardProps {
  image: string;
  title: string;
  category: string;
  description: string;
  members: number;
  events: number;
  iconColor: string;
}
export interface NewsFilterProps {
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClubChange: (value: string) => void;
  onDateChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
}