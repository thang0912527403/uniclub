export interface EventDetailDto {
    eventId: number;
    clubId?: number;
    eventName: string;
    description: string;
    imageUrl?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isPublic: boolean;
    status: string;
    createdAt: string;
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
}

export interface UpdateEventRequest {
    eventId: number;
    eventName: string;
    description: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    imageUrl?: string;
}

export interface SessionDto {
    scheduleId: number;
    scheduleName: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
}

export interface CreateSessionRequest {
    eventId: number;
    sessionName: string;
    startTime: string;
    endTime: string;
    description?: string;
    location?: string;
}

export interface OpenRegistrationRequest {
    eventId: number;
    registrationStartDate: string;
    registrationEndDate: string;
    maxAttendees?: number;
}
