import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("home", "routes/home.tsx"),
  // Dashboard route
  route("dashboard", "routes/dashboard.tsx"),

  // Club routes
  route("clubs", "routes/clubs/clubs.tsx"),
  route("clubs/:id", "routes/clubs/clubs.$id.tsx"),
  route("clubs/create", "routes/clubs/clubs.create.tsx"),
  route("recruitment-campaigns", "routes/recruitment-campaigns.tsx"),
  route("applications", "routes/applications.tsx"),
  route("clubs/edit/:id", "routes/clubs/clubs.edit.$id.tsx"),
  route("club/manage-posts", "routes/clubs/clubpost.tsx"),
  route("club/post/edit/:id", "routes/clubs/clubpost.edit.$id.tsx"),
  route("club/posts", "routes/clubposts/clubpost.tsx"),
  route("club/posts/:id", "routes/clubposts/clubpost.$id.tsx"),

  // Users (CRUD)
  route("users", "routes/users.tsx"),
  route("club-roles", "routes/club-roles.tsx"),

  // Auth routes
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("auth/verify-email", "routes/auth/verify-email.tsx"),
  route("auth/change-password", "routes/auth/change-password.tsx"),

  // Interview routes
  route("interview/schedule", "routes/interview-schedule.tsx"),
  route("interview/room/:roomCode?", "routes/interview-room.tsx"),
  // Event routes
  route("events", "routes/events.tsx"),
  route("events/create", "routes/events.create.tsx"),
  route("events/calendar", "routes/events.calendar.tsx"),
  route("events/reports", "routes/events.reports.tsx"),
  route("events/:id", "routes/events.$id.tsx"),
  route("events/:id/edit", "routes/events.$id.edit.tsx"),

  // Public event routes (no auth, uses landing Navbar/Footer)
  route("public/events", "routes/public.events.tsx"),
  route("public/events/:id", "routes/public.events.$id.tsx"),

  // Meeting routes
  route("meeting/:roomId?", "routes/meeting.tsx"),

  // Error routes
  route("401", "routes/error/401.tsx"),
  route("403", "routes/error/403.tsx"),

  // Catch-all route
  route("*", "routes/error/404.tsx"),

  // User Profile route
  route("profile", "routes/user_profile.tsx"),

  // Question route - dynamic formId from URL
  route("question/:formId?", "routes/question.tsx"),

  // Chiến dịch tuyển dụng (public detail)
  route("campaign/:id", "routes/campaign.$id.tsx"),

  // My applications
  route("my-applications", "routes/my-applications.tsx"),

  // Campaign form manager
  route("campaign-forms/:campaignId", "routes/campaign-forms.tsx"),
] satisfies RouteConfig;
