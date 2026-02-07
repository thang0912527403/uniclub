import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("RecruitmentCampaign", "routes/recruitment-campaigns.tsx"),
] satisfies RouteConfig;
