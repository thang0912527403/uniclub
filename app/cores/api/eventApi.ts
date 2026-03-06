import { baseApi } from './baseApi';
import {
    type EventDetailDto,
    type CreateEventRequest,
    type UpdateEventRequest,
    type SessionDto,
    type CreateSessionRequest,
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
        getAllEvents: builder.query<EventDetailDto[], { pageNumber?: number; pageSize?: number }>({
            query: ({ pageNumber = 1, pageSize = 10 } = {}) =>
                `/events?pageNumber=${pageNumber}&pageSize=${pageSize}`,
            providesTags: ['Event'],
        }),

        getEventById: builder.query<EventDetailDto, number>({
            query: (id) => `/events/${id}`,
            providesTags: (result, error, id) => [{ type: 'Event', id }],
        }),

        /**
         * Create event with optional image — all in one multipart/form-data request.
         * image is attached as the 'image' field if provided.
         */
        createEvent: builder.mutation<EventDetailDto, CreateEventRequest & { image?: File }>({
            query: ({ image, ...data }) => ({
                url: '/events',
                method: 'POST',
                body: buildEventFormData(data, image),
                formData: true,
            }),
            invalidatesTags: ['Event'],
        }),

        /**
         * Update event with optional new image — all in one multipart/form-data request.
         * image is attached as the 'image' field if provided.
         */
        updateEvent: builder.mutation<EventDetailDto, UpdateEventRequest & { image?: File }>({
            query: ({ image, ...data }) => ({
                url: `/events/${data.eventId}`,
                method: 'PUT',
                body: buildEventFormData(data, image),
                formData: true,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        /** Standalone image re-upload for an existing event (edit page) */
        uploadEventImage: builder.mutation<{ message: string; eventId: number; imageUrl: string }, { eventId: number; file: File }>({
            query: ({ eventId, file }) => {
                const formData = new FormData();
                formData.append('image', file);
                return {
                    url: `/events/${eventId}/image`,
                    method: 'POST',
                    body: formData,
                    formData: true,
                };
            },
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        createSession: builder.mutation<SessionDto, CreateSessionRequest>({
            query: (session) => ({
                url: `/events/${session.eventId}/sessions`,
                method: 'POST',
                body: session,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }],
        }),

        openRegistration: builder.mutation<EventDetailDto, OpenRegistrationRequest>({
            query: (request) => ({
                url: `/events/${request.eventId}/open-registration`,
                method: 'PATCH',
                body: request,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        registerEvent: builder.mutation<void, number>({
            query: (eventId) => ({
                url: `/events/${eventId}/register`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Event', id }, 'Event'],
        }),

        startEvent: builder.mutation<{ checkInCode: string }, number>({
            query: (eventId) => ({
                url: `/events/${eventId}/start`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Event', id }, 'Event'],
        }),

        checkInEvent: builder.mutation<void, { eventId: number; checkInCode: string }>({
            query: ({ eventId, checkInCode }) => ({
                url: `/events/checkin`,
                method: 'POST',
                body: { eventId, checkInCode },
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Event', id: arg.eventId }, 'Event'],
        }),

        completeEvent: builder.mutation<void, number>({
            query: (eventId) => ({
                url: `/events/${eventId}/complete`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Event', id }, 'Event'],
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
    useOpenRegistrationMutation,
    useRegisterEventMutation,
    useStartEventMutation,
    useCheckInEventMutation,
    useCompleteEventMutation,
} = eventApi;
