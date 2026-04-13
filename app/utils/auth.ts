import Cookies from 'js-cookie';
import type { LoginResponse } from '~/cores/api/types/auth';
import { store } from '~/cores/store';
import { baseApi } from '~/cores/api/baseApi';

export function getUserId(): string {
  return Cookies.get('userId') || '';
}

export function getClubId(): number {
  return Number(Cookies.get('clubId')) || 0;
}

export function getAccessToken(): string | undefined {
  return Cookies.get('accessToken');
}

export function isLoggedIn(): boolean {
  return !!Cookies.get('accessToken');
}

export function loginUser(payload: LoginResponse) {
  Cookies.set('accessToken', payload.accessToken);
  Cookies.set('refreshToken', payload.refreshToken ?? '');
  if (payload.user?.userId) {
    Cookies.set('userId', payload.user.userId);
  }
  // Reset cache từ tài khoản cũ khi login mới
  store.dispatch(baseApi.util.resetApiState());
  window.dispatchEvent(new Event('authchange'));
}

export function logoutUser() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('userId');
  Cookies.remove('clubId');
  // Xoá toàn bộ cache RTK Query → tránh hiện data tài khoản cũ
  store.dispatch(baseApi.util.resetApiState());
  window.dispatchEvent(new Event('authchange'));
}

export function setClubId(clubId: number) {
  Cookies.set('clubId', String(clubId), { expires: 365, path: '/' });
}
