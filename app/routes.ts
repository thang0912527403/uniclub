import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // ─── Public routes (không cần đăng nhập) ──────────────────
  index("routes/_index.tsx"),
  route("home", "routes/home.tsx"),

  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("auth/verify-email", "routes/auth/verify-email.tsx"),

  // PayOS callback routes (public)
  route("payos/return", "routes/payos.return.tsx"),
  route("payos/cancel", "routes/payos.cancel.tsx"),

  // Public event routes
  route("public/events", "routes/public.events.tsx"),
  route("public/events/:id", "routes/public.events.$id.tsx"),
  route("public/news", "routes/news.tsx"),
  route("public/news/:id", "routes/news.$id.tsx"),
  route("campaign/:id", "routes/campaign.$id.tsx"),

  // Error routes
  route("401", "routes/error/401.tsx"),
  route("403", "routes/error/403.tsx"),
  route("*", "routes/error/404.tsx"),

  // ─── Protected routes (cần đăng nhập) ─────────────────────
  layout("components/ProtectedRoute.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("profile", "routes/user_profile.tsx"),
    route("auth/change-password", "routes/auth/change-password.tsx"),
    route("my-applications", "routes/my-applications.tsx"),

    // User management
    route("users", "routes/users.tsx"),

    // Club management
    route("clubs", "routes/clubs/clubs.tsx"),
    route("clubs/:id", "routes/clubs/clubs.$id.tsx"),
    route("clubs/create", "routes/clubs/clubs.create.tsx"),
    route("clubs/edit/:id", "routes/clubs/clubs.edit.$id.tsx"),
    route("clubs/:id/organization", "routes/clubs/clubs.$id.structure.tsx"),
    route(
      "clubs/:id/funds/:fundId",
      "routes/clubs/clubs.$id.funds.$fundId.tsx",
    ),
    route("clubs/:id/payos", "routes/clubs/clubs.$id.payos.tsx"),
    route("clubs/:clubId/members", "routes/clubs/clubmembers.tsx"),
    route("club-roles", "routes/club-roles.tsx"),
    route("manage-clubs", "routes/my-clubs.tsx"),
    route("application-form/:formId?", "routes/question.tsx"),
    // Department
    route("department", "routes/department.tsx"),
    route("department/:id", "routes/department.member.tsx"),

    // Club content management
    route("club/post/edit/:id", "routes/clubs/clubpost.edit.$id.tsx"),
    route("club/posts", "routes/clubposts/clubpost.tsx"),
    route("club/posts/:id", "routes/clubposts/clubpost.$id.tsx"),

    // Recruitment & Applications
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

    // Events
    route("events", "routes/events.tsx"),
    route("events/create", "routes/events.create.tsx"),
    route("events/calendar", "routes/events.calendar.tsx"),
    route("events/reports", "routes/events.reports.tsx"),
    route("events/:id", "routes/events.$id.tsx"),
    route("events/:id/edit", "routes/events.$id.edit.tsx"),

    // Funds
    route("funds", "routes/funds.tsx"),
    route("funds/my", "routes/funds.my.tsx"),
    route("funds/transactions", "routes/funds.transactions.tsx"),
    route("funds/reports", "routes/funds.reports.tsx"),
    route("funds/payos", "routes/funds.payos.tsx"),
    route("funds/:fundId", "routes/funds.$fundId.tsx"),

    // Meeting (WebRTC)
    route("meeting/:roomId?", "routes/meeting.tsx"),
  ]),
] satisfies RouteConfig;
