import { baseApi } from './baseApi';
import {
    type EventDetailDto,
    type CreateEventRequest,
    type UpdateEventRequest,
    type SessionDto,
    type CreateSessionRequest,
    type UpdateSessionRequest,
    type DeleteSessionRequest,
    type OpenRegistrationRequest
} from './types';

/** Build FormData from an event request + optional image file */
function buildEventFormData(data: Record<string, any>, image?: File): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) fd.append(key, String(val));
    });
    if (image) fd.append('image', image);
    return fd;
}

export interface MyEventItem {
    eventId: number;
    eventName: string;
    imageUrl?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    status: string;
    clubName?: string;
    clubId?: number;
    isAttendee: boolean;
    attendanceStatus?: string;
    isCollaborator: boolean;
    roleName?: string;
    policies: string[];
}

export const eventApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ===== PUBLIC endpoints (api/events) =====

        getAllEvents: builder.query<
            { items: EventDetailDto[]; total: number; page: number; pageSize: number },
            { pageNumber?: number; pageSize?: number; status?: string; clubId?: number }
        >({
            query: ({ pageNumber = 1, pageSize = 10, status, clubId } = {}) => {
                const params = new URLSearchParams();
                params.set('pageNumber', String(pageNumber));
                params.set('pageSize', String(pageSize));
                if (status) params.set('status', status);
                if (clubId) params.set('clubId', String(clubId));
                return `/events?${params.toString()}`;
            },
            providesTags: ['Event'],
        }),

        getEventById: builder.query<EventDetailDto, number>({
            query: (id) => `/events/${id}`,
            providesTags: (result, error, id) => [{ type: 'Event', id }],
        }),

        // ===== CLUB-SCOPED endpoints (api/club/{clubId}/events) =====

        /**
         * Create event with optional image — all in one multipart/form-data request.
         * clubId is used in the URL path, image is attached as the 'image' field.
         */
        createEvent: builder.mutation<EventDetailDto, CreateEventRequest & { clubId: number; image?: File }>({
            query: ({ image, clubId, ...data }) => ({
                url: `/club/${clubId}/events`,
                method: 'POST',
                body: buildEventFormData(data, image),
                formData: true,
            }),
            invalidatesTags: ['Event'],
        }),

        /**
         * Update event with optional new image — all in one multipart/form-data request.
         */
        updateEvent: builder.mutation<EventDetailDto, UpdateEventRequest & { clubId: number; image?: File }>({
            query: ({ image, clubId, ...data }) => ({
                url: `/club/${clubId}/events/${data.eventId}`,
                method: 'PUT',
                body: buildEventFormData(data, image),
                formData: true,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        /** Standalone image re-upload for an existing event (edit page) */
        uploadEventImage: builder.mutation<{ message: string; eventId: number; imageUrl: string }, { clubId: number; eventId: number; file: File }>({
            query: ({ clubId, eventId, file }) => {
                const formData = new FormData();
                formData.append('image', file);
                return {
                    url: `/club/${clubId}/events/${eventId}/image`,
                    method: 'POST',
                    body: formData,
                    formData: true,
                };
            },
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        createSession: builder.mutation<SessionDto, CreateSessionRequest & { clubId: number }>({
            query: ({ clubId, ...session }) => ({
                url: `/club/${clubId}/events/${session.eventId}/sessions`,
                method: 'POST',
                body: session,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        updateSession: builder.mutation<SessionDto, UpdateSessionRequest & { clubId: number }>({
            query: ({ clubId, eventId, scheduleId, ...body }) => ({
                url: `/club/${clubId}/events/${eventId}/sessions/${scheduleId}`,
                method: 'PUT',
                body: { scheduleId, eventId, ...body },
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        deleteSession: builder.mutation<void, DeleteSessionRequest & { clubId: number }>({
            query: ({ clubId, eventId, scheduleId }) => ({
                url: `/club/${clubId}/events/${eventId}/sessions/${scheduleId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        openRegistration: builder.mutation<EventDetailDto, OpenRegistrationRequest & { clubId: number }>({
            query: ({ clubId, ...request }) => ({
                url: `/club/${clubId}/events/${request.eventId}/open-registration`,
                method: 'PATCH',
                body: request,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        // ===== USER-FACING event actions (api/events — still on public route) =====

        registerEvent: builder.mutation<void, number>({
            query: (eventId) => ({
                url: `/events/${eventId}/register`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Event', id }, 'Event'],
        }),

        startEvent: builder.mutation<{ checkInCode: string; expiresAt?: string }, { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => ({
                url: `/club/${clubId}/events/${eventId}/start`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        checkInEvent: builder.mutation<void, { eventId: number; checkInCode: string }>({
            query: ({ eventId, checkInCode }) => ({
                url: `/events/${eventId}/checkin`,
                method: 'POST',
                body: { eventId, checkInCode },
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        completeEvent: builder.mutation<void, { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => ({
                url: `/club/${clubId}/events/${eventId}/complete`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        cancelEvent: builder.mutation<void, { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => ({
                url: `/club/${clubId}/events/${eventId}/cancel`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        /** Get current user's role & policies for a specific event */
        getMyEventRole: builder.query<{ role: string | null; policies: string[] }, { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => `/club/${clubId}/events/${eventId}/my-role`,
            providesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        /** Get events the current user participates in (attendee or collaborator) */
        getMyEvents: builder.query<
            { items: MyEventItem[]; total: number; page: number; pageSize: number },
            { search?: string; page?: number; pageSize?: number }
        >({
            query: ({ search, page = 1, pageSize = 10 } = {}) => {
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                params.set('page', String(page));
                params.set('pageSize', String(pageSize));
                return `/events/my-events?${params.toString()}`;
            },
            providesTags: ['Event'],
        }),

        // ===== Makeup Check-in =====

        makeupCheckIn: builder.mutation<
            { success: boolean; message: string; memberName: string; previousStatus: string },
            { clubId: number; eventId: number; userId: string }
        >({
            query: ({ clubId, eventId, userId }) => ({
                url: `/club/${clubId}/events/${eventId}/makeup-checkin/${userId}`,
                method: 'POST',
            }),
            invalidatesTags: ['Event'],
        }),

        bulkMakeupCheckIn: builder.mutation<
            { checkedIn: number; skipped: number; total: number; message: string },
            { clubId: number; eventId: number; userIds: string[] }
        >({
            query: ({ clubId, eventId, userIds }) => ({
                url: `/club/${clubId}/events/${eventId}/makeup-checkin-bulk`,
                method: 'POST',
                body: userIds,
            }),
            invalidatesTags: ['Event'],
        }),
    }),
});

export const {
    useGetAllEventsQuery,
    useGetEventByIdQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useUploadEventImageMutation,
    useCreateSessionMutation,
    useUpdateSessionMutation,
    useDeleteSessionMutation,
    useOpenRegistrationMutation,
    useRegisterEventMutation,
    useStartEventMutation,
    useCheckInEventMutation,
    useCompleteEventMutation,
    useCancelEventMutation,
    useGetMyEventRoleQuery,
    useGetMyEventsQuery,
    useMakeupCheckInMutation,
    useBulkMakeupCheckInMutation,
} = eventApi;
