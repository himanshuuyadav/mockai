export const APP_NAME = "MockAI";

export const FEATURE_ROUTES = [
  {
    href: "/resume",
    title: "Resume",
    dashboardDescription: "Upload and parse your latest resume.",
    pageDescription: "Resume upload and parsing module scaffold is ready.",
  },
  {
    href: "/interview",
    title: "Interview",
    dashboardDescription: "Run AI-generated mock interview sessions.",
    pageDescription: "Interview simulation workspace scaffold is ready.",
  },
  {
    href: "/report",
    title: "Report",
    dashboardDescription: "Review feedback and performance trends.",
    pageDescription: "Performance analytics and charting scaffold is ready.",
  },
  {
    href: "/profile",
    title: "Profile",
    dashboardDescription: "Manage account and interview preferences.",
    pageDescription: "Account settings and profile management scaffold is ready.",
  },
] as const;

export const PROTECTED_ROUTES = ["/dashboard", ...FEATURE_ROUTES.map((route) => route.href)];
