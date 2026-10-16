import { ROUTES } from "./routes";

export const NAV_ITEMS = Object.freeze([
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: "dashboard" },
  { to: ROUTES.NOTIFICATIONS, label: "Notifications", icon: "bell" },
  { to: ROUTES.PROFILE, label: "Profile", icon: "user" },
  { to: ROUTES.SETTINGS, label: "Settings", icon: "settings" },
]);
