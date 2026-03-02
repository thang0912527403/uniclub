export interface EventRegistrationRequest {
    eventId: number;
    userId: string;
}

export interface CheckInRequest {
    eventId: number;
    userId: string;
    code: string;
    latitude?: number;
    longitude?: number;
}

export interface CheckInCodeResponse {
    eventId: number;
    code: string;
    expiresAt: string;
    qrContent: string;
}

export interface EvaluateMemberRequest {
    eventId: number;
    userId: string;
    score: number;
    comment?: string;
}

export interface AttendanceDetailDto {
    attendId: number;
    eventId: number;
    userId: string;
    memberName: string;
    studentId?: string;
    registrationDate: string;
    attendanceStatus: 'REGISTERED' | 'PRESENT' | 'ABSENT' | 'CANCELLED';
    checkInTime?: string;
    score?: number;
    comment?: string;
}
