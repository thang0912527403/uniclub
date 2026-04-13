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
    email?: string;
    studentId?: string;
    registrationDate: string;
    attendanceStatus: 'PENDING' | 'REGISTERED' | 'WAITLIST' | 'PRESENT' | 'ABSENT' | 'CANCELLED' | 'REJECTED';
    checkInTime?: string;
    score?: number;
    comment?: string;
}

/** Response for GET my-checkin-qr — participant shows this QR at event; organizer scans it */
export interface CheckInQrResponse {
    token?: string;
    qrContent?: string; // alias from backend
    eventId?: number;
    expiresAt?: string;
}

/** Body for POST checkin-qr — token = content read from participant's QR */
export interface CheckInByQrRequest {
    token: string;
}

export interface CheckInByQrResponse {
    message?: string;
    memberName?: string;
}
