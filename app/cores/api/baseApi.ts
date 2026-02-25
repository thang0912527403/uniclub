import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

// Cấu hình base URLs cho các services
export const API_URLS = {
  MAIN_SERVICE: 'https://localhost:7237/api',
  USER_SERVICE: 'https://localhost:7238/api',
  NOTIFICATION_SERVICE: 'https://localhost:7239/api',
};

// Common headers
const prepareHeaders = (headers: Headers) => {
  const accessToken = Cookies.get('accessToken');
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
export const baseApi = createApiWithBaseUrl(API_URLS.MAIN_SERVICE, 'api', ['RecruitmentCampaign', 'Dashboard', 'Club', 'User', 'Notification', 'Interview', 'Application']);
