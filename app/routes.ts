import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Dashboard route
  route("dashboard", "routes/dashboard.tsx"),

  // Club routes
  route("clubs", "routes/clubs/clubs.tsx"),
  route("clubs/:id", "routes/clubs/clubs.$id.tsx"),
  route("clubs/create", "routes/clubs/clubs.create.tsx"),
  route("recruitment-campaigns", "routes/recruitment-campaigns.tsx"),
  route("applications", "routes/applications.tsx"),
  route("clubs/edit/:id", "routes/clubs/clubs.edit.$id.tsx"),
  route("club/posts", "routes/clubs/clubpost.tsx"),
  route("club/post/edit/:id", "routes/clubs/clubpost.edit.$id.tsx"),

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

  // Funds routes
  route("funds", "routes/funds.tsx"),
  route("funds/transactions", "routes/funds.transactions.tsx"),
  route("funds/reports", "routes/funds.reports.tsx"),
  route("funds/settings", "routes/funds.settings.tsx"),

  // Error routes
  route("401", "routes/error/401.tsx"),
  route("403", "routes/error/403.tsx"),

  // Catch-all route
  route("*", "routes/error/404.tsx"),

  // User Profile route
  route("user/profile", "routes/user_profile.tsx"),

  // Question route
  route("question", "routes/question.tsx"),

  // Campaign route
  route("campaign/:id", "routes/campaign.$id.tsx"),

  // My applications route
  route("my-applications", "routes/my-applications.tsx"),
] satisfies RouteConfig;
