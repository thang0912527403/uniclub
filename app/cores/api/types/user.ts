export interface User {
  UserId: string;
  FullName: string;
  Email: string;
  PhoneNumber?: string | null;
  DateOfBirth?: string | null;
  Gender?: string | null;
  Address?: string | null;
  Avatar?: string | null;
  StudentId?: string | null;
  Major?: string | null;
  JoinDate?: string | null;
  Status?: string | null;
  CreatedAt?: string | null;
}