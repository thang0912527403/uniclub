import Cookies from 'js-cookie';
import type { LoginResponse } from '~/cores/api/types/auth';

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
  Cookies.set('accessToken', payload.accessToken, { path: '/' });
  Cookies.set('refreshToken', payload.refreshToken ?? '', { path: '/' });
  if (payload.user?.userId) {
    Cookies.set('userId', payload.user.userId, { path: '/' });
  }
  window.dispatchEvent(new Event('authchange'));
}

export function logoutUser() {
  Cookies.remove('accessToken', { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });
  Cookies.remove('userId', { path: '/' });
  Cookies.remove('clubId', { path: '/' });
  window.dispatchEvent(new Event('authchange'));
}

export function setClubId(clubId: number) {
  Cookies.set('clubId', String(clubId), { expires: 365, path: '/' });
}
