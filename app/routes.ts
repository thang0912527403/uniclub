import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Dashboard route
  route("dashboard", "routes/dashboard.tsx"),

  // Club routes
  route("clubs", "routes/clubs.tsx"),
  route("recruitment-campaign", "routes/recruitment-campaigns.tsx"),

  // Users (CRUD)
  route("users", "routes/users.tsx"),

  // Auth routes
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("auth/verify-email", "routes/auth/verify-email.tsx"),
  route("auth/change-password", "routes/auth/change-password.tsx"),

  // Meeting routes
  route("meeting/:roomId?", "routes/meeting.tsx"),

  // Catch-all route
  route("*", "routes/404.tsx"),

] satisfies RouteConfig;
