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
  Cookies.set('accessToken', payload.accessToken);
  Cookies.set('refreshToken', payload.refreshToken ?? '');
  if (payload.user?.userId) {
    Cookies.set('userId', payload.user.userId);
  }
}

export function logoutUser() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('userId');
  Cookies.remove('clubId');
}

export function setClubId(clubId: number) {
  Cookies.set('clubId', String(clubId), { expires: 365, path: '/' });
}
