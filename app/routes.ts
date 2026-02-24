import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Dashboard route
  route("dashboard", "routes/dashboard.tsx"),

  // Club routes
  route("clubs", "routes/clubs.tsx"),
  route("clubs/:id", "routes/clubs.$id.tsx"),
  route("clubs/create", "routes/create-club.tsx"),
  route("recruitment-campaigns", "routes/recruitment-campaigns.tsx"),

  // Auth routes
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("auth/verify-email", "routes/auth/verify-email.tsx"),
  route("auth/change-password", "routes/auth/change-password.tsx"),

  // Meeting routes
  route("meeting/:roomId?", "routes/meeting.tsx"),

  // Error routes
  route("401", "routes/401.tsx"),
  route("403", "routes/403.tsx"),

  // Catch-all route
  route("*", "routes/404.tsx"),

  // User Profile route
  route("user/profile", "routes/user_profile.tsx"),

  // Question route
  route("question", "routes/question.tsx"),
] satisfies RouteConfig;
