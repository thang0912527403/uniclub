import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Cấu hình base URLs cho các services
export const API_URLS = {
  MAIN_SERVICE: 'https://localhost:7237/api',
  USER_SERVICE: 'https://localhost:7238/api',
  NOTIFICATION_SERVICE: 'https://localhost:7239/api',
};

// Common headers
const prepareHeaders = (headers: Headers) => {
  const token = localStorage.getItem('token');
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
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

// Main API cho RecruitmentCampaign
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_URLS.MAIN_SERVICE,
    prepareHeaders 
  }),
  tagTypes: ['RecruitmentCampaign'],
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
