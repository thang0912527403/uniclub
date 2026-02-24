import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Cấu hình base URLs cho các services
export const API_URLS = {
  MAIN_SERVICE: 'https://localhost:7237/api',
  USER_SERVICE: 'https://localhost:7238/api',
  NOTIFICATION_SERVICE: 'https://localhost:7239/api',
};

// Common headers
const prepareHeaders = (headers: Headers) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }
  headers.set('Content-Type', 'application/json');
  return headers;
};

// Helper function để tạo API với baseUrl riêng
export const createApiWithBaseUrl = (baseUrl: string, reducerPath: string, tagTypes: string[]) => {
  return createApi({
    reducerPath,
    baseQuery: fetchBaseQuery({
      baseUrl,
      prepareHeaders
    }),
    tagTypes,
    endpoints: () => ({}),
  });
};

// Main API cho RecruitmentCampaign, Dashboard, Club
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.MAIN_SERVICE,
    prepareHeaders
  }),
  tagTypes: ['RecruitmentCampaign', 'Dashboard', 'Club', 'ClubRole', 'Policy', 'User', 'Notification'],
  endpoints: () => ({}),
});

// User API với base URL riêng (ví dụ)
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.USER_SERVICE,
    prepareHeaders
  }),
  tagTypes: ['User'],
  endpoints: () => ({}),
});

// Notification API với base URL riêng (ví dụ)
export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.NOTIFICATION_SERVICE,
    prepareHeaders
  }),
  tagTypes: ['Notification'],
  endpoints: () => ({}),
});

