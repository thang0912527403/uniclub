import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

/** Khi mở qua localhost → gọi thẳng backend; khi mở qua ngrok/proxy → dùng /api (cùng origin). */
function getMainServiceBaseUrl(): string {
  const rawEnv = import.meta.env.VITE_API_URL as string | undefined;
  const normalize = (u: string) => {
    const base = u.endsWith('/') ? u.slice(0, -1) : u;
    // Nếu env chỉ là host (vd http://localhost:7237) thì tự thêm /api cho khớp chuẩn backend
    if (base.endsWith('/api')) return base;
    return `${base}/api`;
  };

  if (typeof window === 'undefined') return normalize(rawEnv ?? 'https://localhost:7237');
  const origin = window.location.origin;
  // Khi chạy local: ưu tiên VITE_API_URL (hỗ trợ http/https + port tuỳ máy)
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
    return normalize(rawEnv ?? 'https://localhost:7237');
  }
  return '/api';
}

export const API_URLS = {
  get MAIN_SERVICE() {
    return getMainServiceBaseUrl();
  },
};

// Common headers
const prepareHeaders = (headers: Headers) => {
  const rawAccessToken = Cookies.get('accessToken');
  const accessToken = rawAccessToken?.replace(/^"|"$/g, '').trim();

  if (accessToken) {
    // Normalize header/token format for all APIs, including dashboardApi.
    const bearerToken = accessToken.startsWith('Bearer ')
      ? accessToken
      : `Bearer ${accessToken}`;
    headers.set('Authorization', bearerToken);
  }
  //headers.set('Content-Type', 'application/json');
  return headers;
};

// Helper: mỗi request lấy baseUrl theo origin (localhost → backend trực tiếp, ngrok → /api)
export const createApiWithBaseUrl = (_baseUrl: string, reducerPath: string, tagTypes: string[]) => {
  return createApi({
    reducerPath,
    refetchOnMountOrArgChange: true,
    baseQuery: async (args, api, extraOptions) => {
      const base = getMainServiceBaseUrl();
      return fetchBaseQuery({ baseUrl: base, prepareHeaders })(args, api, extraOptions);
    },
    tagTypes,
    endpoints: () => ({}),
  });
};

// Main API cho RecruitmentCampaign, Dashboard, Club
export const baseApi = createApiWithBaseUrl('', 'api', [
  'RecruitmentCampaign', 'Dashboard', 'Club', 'ClubFund',
  'User', 'Notification', 'Interview', 'Application',
  'ClubRole', 'Policy', 'Department', 'Member',
  'Event', 'Attendance',
]);
