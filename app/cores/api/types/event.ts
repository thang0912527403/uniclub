export interface EventDetailDto {
    eventId: number;
    clubId?: number;
    eventName: string;
    description: string;
    imageUrl?: string;
    location?: string;
    meetLink?: string;
    startDate?: string;
    endDate?: string;
    isPublic: boolean;
    isOnline?: boolean;
    requiresApproval?: boolean;
    status: string;
    createdAt: string;
    maxAttendees?: number;
    currentAttendees: number;
    registrationStartDate?: string;
    registrationEndDate?: string;
    checkInCode?: string;
    codeExpiresAt?: string;
    sessions: SessionDto[];
}

export interface CreateEventRequest {
    eventName: string;
    description: string;
    location?: string;
    imageUrl?: string;
    startDate: string;
    endDate: string;
    clubId?: number;
    requiresApproval?: boolean;
    isPublic?: boolean;
}

export interface UpdateEventRequest {
    eventId: number;
    clubId?: number;
    eventName: string;
    description: string;
    location?: string;
    meetLink?: string;
    startDate?: string;
    endDate?: string;
    imageUrl?: string;
    isOnline?: boolean;
    requiresApproval?: boolean;
    isPublic?: boolean;
}

export interface SessionDto {
    scheduleId: number;
    scheduleName: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
    sessionType?: string;
}

export interface CreateSessionRequest {
    eventId: number;
    sessionName: string;
    startTime: string;
    endTime: string;
    description?: string;
    location?: string;
    sessionType?: string;
}

export interface UpdateSessionRequest {
    scheduleId: number;
    eventId: number;
    sessionName: string;
    startTime: string;
    endTime: string;
    description?: string;
    location?: string;
    sessionType?: string;
}

export interface DeleteSessionRequest {
    scheduleId: number;
    eventId: number;
}

export interface OpenRegistrationRequest {
    eventId: number;
    registrationStartDate: string;
    registrationEndDate: string;
    maxAttendees?: number;
}
