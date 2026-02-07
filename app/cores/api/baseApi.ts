import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
    
// Cấu hình base URLs
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_BACKEND_URL || 'https://localhost:7237',
  NOTIFICATION_SERVICE: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3002/api',
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

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders,
});

// Custom base query để tự động bóc tách trường 'data' từ backend wrapper { success, message, data }
const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
  // Nếu có dữ liệu trả về thành công từ fetchBaseQuery
  if (result.data) {
    const res = result.data as { success?: boolean; data?: any; message?: string };
    
    // Nếu backend trả về cấu trúc wrapper { success, data }
    if (typeof res === 'object' && res !== null && 'success' in res && 'data' in res) {
      if (res.success) {
        // Chỉ trả về phần 'data' để các components sử dụng trực tiếp
        return { data: res.data };
      } else {
        // Chuyển thành lỗi nếu success = false
        return {
          error: {
            status: 400, // Hoặc status code phù hợp từ backend
            data: { message: res.message || 'An error occurred' }
          }
        };
      }
    }
  }
  
  return result;
};

// Base API
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  tagTypes: ['User', 'Notification', 'Club'],
  endpoints: () => ({}),
});

