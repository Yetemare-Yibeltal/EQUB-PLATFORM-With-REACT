import { ROUTES } from "./routes";

export const NAV_ITEMS = Object.freeze([
  { to: ROUTES.DASHBOARD, label: "Dashboard", icon: "dashboard", mobile: true },
  { to: ROUTES.GROUPS, label: "My equbs", icon: "users", mobile: true },
  {
    to: ROUTES.CONTRIBUTIONS,
    label: "Contributions",
    icon: "wallet",
    mobile: true,
  },
  { to: ROUTES.PAYMENTS, label: "Payments", icon: "card", mobile: false },
  { to: ROUTES.PAYOUTS, label: "Payouts", icon: "gift", mobile: false },
  {
    to: ROUTES.NOTIFICATIONS,
    label: "Notifications",
    icon: "bell",
    mobile: true,
  },
  { to: ROUTES.PROFILE, label: "Profile", icon: "user", mobile: false },
  { to: ROUTES.SETTINGS, label: "Settings", icon: "settings", mobile: true },
]);

export const ADMIN_NAV_ITEM = Object.freeze({
  to: ROUTES.ADMIN,
  label: "Admin",
  icon: "shield",
  mobile: true,
});

export const ADMIN_TABS = Object.freeze([
  { to: ROUTES.ADMIN, label: "Overview", end: true },
  { to: ROUTES.ADMIN_USERS, label: "Users" },
  { to: ROUTES.ADMIN_GROUPS, label: "Groups" },
  { to: ROUTES.ADMIN_PAYMENTS, label: "Payments" },
  { to: ROUTES.ADMIN_AUDIT, label: "Audit log" },
  { to: ROUTES.ADMIN_JOBS, label: "Jobs" },
]);
