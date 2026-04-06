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

export const eventApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ===== PUBLIC endpoints (api/events) =====

        getAllEvents: builder.query<EventDetailDto[], { pageNumber?: number; pageSize?: number }>({
            query: ({ pageNumber = 1, pageSize = 10 } = {}) =>
                `/events?pageNumber=${pageNumber}&pageSize=${pageSize}`,
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

        startEvent: builder.mutation<{ checkInCode: string }, { clubId: number; eventId: number }>({
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

        /** Get current user's role & policies for a specific event */
        getMyEventRole: builder.query<{ role: string | null; policies: string[] }, { clubId: number; eventId: number }>({
            query: ({ clubId, eventId }) => `/club/${clubId}/events/${eventId}/my-role`,
            providesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
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
    useGetMyEventRoleQuery,
} = eventApi;
