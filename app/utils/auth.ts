import Cookies from "js-cookie";
import type { LoginResponse } from "~/cores/api/types/auth";

export function getUserId(): string {
  return Cookies.get("userId") || "";
}

export function getClubId(): number {
  return Number(Cookies.get("clubId")) || 0;
}

export function getAccessToken(): string | undefined {
  return Cookies.get("accessToken");
}

export function isLoggedIn(): boolean {
  return !!Cookies.get("accessToken");
}

export function loginUser(payload: LoginResponse) {
  // Set hết hạn sau 60 phút
  const in60Minutes = new Date(new Date().getTime() + 60 * 60 * 1000);

  Cookies.set("accessToken", payload.accessToken, {
    expires: in60Minutes,
    path: "/",
  });
  Cookies.set("sessionExpiry", String(in60Minutes), {
    expires: in60Minutes,
    path: "/",
  });
  Cookies.set("refreshToken", payload.refreshToken ?? "", {
    expires: 7,
    path: "/",
  });
  if (payload.user?.userId) {
    Cookies.set("userId", payload.user.userId, {
      expires: in60Minutes,
      path: "/",
    });
  }
  window.dispatchEvent(new Event("authchange"));
}

export function logoutUser() {
  Cookies.remove("accessToken", { path: "/" });
  Cookies.remove("refreshToken", { path: "/" });
  Cookies.remove("userId", { path: "/" });
  Cookies.remove("clubId", { path: "/" });
  window.dispatchEvent(new Event("authchange"));
}

export function setClubId(clubId: number) {
  const expiry = Cookies.get("sessionExpiry");

  // Nếu có sessionExpiry thì lấy đúng mốc đó, nếu không có (lỗi) thì mới fallback về 60p
  const expires = expiry
    ? new Date(Number(expiry))
    : new Date(new Date().getTime() + 60 * 60 * 1000);
  Cookies.set("clubId", String(clubId), { expires, path: "/" });
}
