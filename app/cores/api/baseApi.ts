import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

/** Khi mở qua localhost → gọi thẳng backend; khi mở qua ngrok/proxy → dùng /api (cùng origin). */
function getMainServiceBaseUrl(): string {
  if (typeof window === 'undefined') return import.meta.env.VITE_API_URL ?? 'https://localhost:7237/api';
  const origin = window.location.origin;
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return 'https://localhost:7237/api';
  return '/api';
}

export const API_URLS = {
  get MAIN_SERVICE() {
    return getMainServiceBaseUrl();
  },
};

// Common headers
const prepareHeaders = (headers: Headers) => {
  const accessToken = Cookies.get('accessToken');
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }
  //headers.set('Content-Type', 'application/json');
  return headers;
};

// Helper: mỗi request lấy baseUrl theo origin (localhost → backend trực tiếp, ngrok → /api)
export const createApiWithBaseUrl = (_baseUrl: string, reducerPath: string, tagTypes: string[]) => {
  return createApi({
    reducerPath,
    baseQuery: async (args, api, extraOptions) => {
      const base = getMainServiceBaseUrl();
      return fetchBaseQuery({ baseUrl: base, prepareHeaders })(args, api, extraOptions);
    },
    tagTypes,
    endpoints: () => ({}),
  });
};

// Main API cho RecruitmentCampaign, Dashboard, Club
export const baseApi = createApiWithBaseUrl('', 'api', ['RecruitmentCampaign', 'Dashboard', 'Club', 'ClubFund', 'User', 'Notification', 'Interview', 'Application']);
