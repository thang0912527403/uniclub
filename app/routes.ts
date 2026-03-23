import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // ─── Public routes (không cần đăng nhập) ──────────────────
  index("routes/_index.tsx"),
  route("home", "routes/home.tsx"),

  // Auth routes
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("auth/verify-email", "routes/auth/verify-email.tsx"),

  // Public event routes
  route("public/events", "routes/public.events.tsx"),
  route("public/events/:id", "routes/public.events.$id.tsx"),

  // Public news routes
  route("public/news", "routes/news.tsx"),
  route("public/news/:id", "routes/news.$id.tsx"),

  // Public campaign detail
  route("campaign/:id", "routes/campaign.$id.tsx"),

  // Question route (public - has own auth guard)
  route("application-form/:formId?", "routes/question.tsx"),

  // Error routes
  route("401", "routes/error/401.tsx"),
  route("403", "routes/error/403.tsx"),
  route("*", "routes/error/404.tsx"),

  // ─── Protected routes (cần đăng nhập) ─────────────────────
  layout("components/ProtectedRoute.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("manage-clubs", "routes/my-clubs.tsx"),
    route("profile", "routes/user_profile.tsx"),
    route("auth/change-password", "routes/auth/change-password.tsx"),
    route("my-applications", "routes/my-applications.tsx"),

    // Club management
    route("clubs", "routes/clubs/clubs.tsx"),
    route("clubs/:id", "routes/clubs/clubs.$id.tsx"),
    route("clubs/create", "routes/clubs/clubs.create.tsx"),
    route("clubs/edit/:id", "routes/clubs/clubs.edit.$id.tsx"),
    route("clubs/:id/structure", "routes/clubs/clubs.$id.structure.tsx"),
    route("clubs/:clubId/members", "routes/clubs/clubmembers.tsx"),
    route("club-roles", "routes/club-roles.tsx"),
    route("recruitment-campaigns", "routes/recruitment-campaigns.tsx"),
    route("campaign-forms/:campaignId", "routes/campaign-forms.tsx"),
    route("club/all-clubs", "routes/clubs-homepage/clubs.tsx"),
    route("club/all-clubs/:id", "routes/clubs-homepage/clubs.$id.tsx"),
    route("club/request", "routes/clubs-homepage/clubrequest.tsx"),
    route("club/all-requests", "routes/clubs/clubrequests.tsx"),

    // Interview routes
    route("interview/schedule", "routes/interview-schedule.tsx"),
    route("interview/room/:roomCode?", "routes/interview-room.tsx"),
    route("interview/comparison", "routes/interview-comparison.tsx"),

    // Event management
    route("events", "routes/events.tsx"),
    route("events/create", "routes/events.create.tsx"),
    route("events/calendar", "routes/events.calendar.tsx"),
    route("events/reports", "routes/events.reports.tsx"),
    route("events/:id", "routes/events.$id.tsx"),
    route("events/:id/edit", "routes/events.$id.edit.tsx"),

    // Meeting
    route("meeting/:roomId?", "routes/meeting.tsx"),
  ]),
] satisfies RouteConfig;
