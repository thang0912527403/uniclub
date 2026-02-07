import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Cấu hình base URLs
export const API_CONFIG = {
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:3001/api',
  NOTIFICATION_SERVICE: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002/api',
  CLUB_SERVICE: process.env.CLUB_SERVICE_URL || 'http://localhost:3003/api',
};

// Common headers
const prepareHeaders = (headers: Headers) => {
  const token = localStorage.getItem('token');
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  return headers;
};

// Base API
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ prepareHeaders }),
  tagTypes: ['User', 'Notification', 'Club'],
  endpoints: () => ({}),
});
