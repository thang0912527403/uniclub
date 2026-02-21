import { baseApi } from './baseApi';
import {
    type EventDetailDto,
    type CreateEventRequest,
    type UpdateEventRequest,
    type SessionDto,
    type CreateSessionRequest,
    type OpenRegistrationRequest
} from './types';

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

        createEvent: builder.mutation<EventDetailDto, CreateEventRequest>({
            query: (event) => ({
                url: '/events',
                method: 'POST',
                body: event,
            }),
            invalidatesTags: ['Event'],
        }),

        updateEvent: builder.mutation<EventDetailDto, UpdateEventRequest>({
            query: (event) => ({
                url: `/events/${event.eventId}`,
                method: 'PUT',
                body: event,
            }),
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
    }),
});

export const {
    useGetAllEventsQuery,
    useGetEventByIdQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useCreateSessionMutation,
    useOpenRegistrationMutation,
} = eventApi;
