import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("home", "routes/home.tsx"),

  route("auth/login", "routes/auth/login.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("auth/verify-email", "routes/auth/verify-email.tsx"),

  route("public/events", "routes/public.events.tsx"),
  route("public/events/:id", "routes/public.events.$id.tsx"),
  route("public/news", "routes/news.tsx"),
  route("public/news/:id", "routes/news.$id.tsx"),
  route("campaign/:id", "routes/campaign.$id.tsx"),
  route("question/:formId?", "routes/question.tsx"),

  layout("components/ProtectedRoute.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("manage-clubs", "routes/my-clubs.tsx"),
    route("profile", "routes/user_profile.tsx"),
    route("auth/change-password", "routes/auth/change-password.tsx"),
    route("my-applications", "routes/my-applications.tsx"),

    route("users", "routes/users.tsx"),
    route("clubs", "routes/clubs/clubs.tsx"),
    route("clubs/:id", "routes/clubs/clubs.$id.tsx"),
    route("clubs/create", "routes/clubs/clubs.create.tsx"),
    route("clubs/edit/:id", "routes/clubs/clubs.edit.$id.tsx"),
    route("clubs/:id/structure", "routes/clubs/clubs.$id.structure.tsx"),
    route("club-roles", "routes/club-roles.tsx"),
    route("club/manage-posts", "routes/clubs/clubpost.tsx"),
    route("club/post/edit/:id", "routes/clubs/clubpost.edit.$id.tsx"),
    route("club/posts", "routes/clubposts/clubpost.tsx"),
    route("club/posts/:id", "routes/clubposts/clubpost.$id.tsx"),
    route("applications", "routes/applications.tsx"),
    route("recruitment-campaigns", "routes/recruitment-campaigns.tsx"),
    route("campaign-forms/:campaignId", "routes/campaign-forms.tsx"),

    route("interview/schedule", "routes/interview-schedule.tsx"),
    route("interview/room/:roomCode?", "routes/interview-room.tsx"),

    route("events", "routes/events.tsx"),
    route("events/create", "routes/events.create.tsx"),
    route("events/calendar", "routes/events.calendar.tsx"),
    route("events/reports", "routes/events.reports.tsx"),
    route("events/:id", "routes/events.$id.tsx"),
    route("events/:id/edit", "routes/events.$id.edit.tsx"),

    route("funds", "routes/funds.tsx"),
    route("funds/transactions", "routes/funds.transactions.tsx"),
    route("funds/reports", "routes/funds.reports.tsx"),
    route("funds/settings", "routes/funds.settings.tsx"),

    route("meeting/:roomId?", "routes/meeting.tsx"),
  ]),

  route("401", "routes/error/401.tsx"),
  route("403", "routes/error/403.tsx"),
  route("*", "routes/error/404.tsx"),
] satisfies RouteConfig;
