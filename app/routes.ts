import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Dashboard route
  route("dashboard", "routes/dashboard.tsx"),

  // Club routes
  route("clubs", "routes/clubs.tsx"),
  route("recruitment-campaign", "routes/recruitment-campaigns.tsx"),

  // Auth routes
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("auth/verify-email", "routes/auth/verify-email.tsx"),
  route("auth/change-password", "routes/auth/change-password.tsx"),

  // Event routes
  route("events", "routes/events.tsx"),
  route("events/create", "routes/events.create.tsx"),
  route("events/calendar", "routes/events.calendar.tsx"),
  route("events/reports", "routes/events.reports.tsx"),
  route("events/:id", "routes/events.$id.tsx"),
  route("events/:id/edit", "routes/events.$id.edit.tsx"),

  // Meeting routes
  route("meeting/:roomId?", "routes/meeting.tsx"),

  // Catch-all route
  route("*", "routes/404.tsx"),

] satisfies RouteConfig;
