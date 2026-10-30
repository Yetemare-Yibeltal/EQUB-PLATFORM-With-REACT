import { ROUTES } from "./routes";

export const NAV_ITEMS = Object.freeze([
  {
    to: ROUTES.DASHBOARD,
    label: "nav.dashboard",
    icon: "dashboard",
    mobile: true,
  },
  { to: ROUTES.GROUPS, label: "nav.groups", icon: "users", mobile: true },
  {
    to: ROUTES.CONTRIBUTIONS,
    label: "nav.contributions",
    icon: "wallet",
    mobile: true,
  },
  { to: ROUTES.PAYMENTS, label: "nav.payments", icon: "card", mobile: false },
  { to: ROUTES.PAYOUTS, label: "nav.payouts", icon: "gift", mobile: false },
  {
    to: ROUTES.NOTIFICATIONS,
    label: "nav.notifications",
    icon: "bell",
    mobile: true,
  },
  { to: ROUTES.PROFILE, label: "nav.profile", icon: "user", mobile: false },
  {
    to: ROUTES.SETTINGS,
    label: "nav.settings",
    icon: "settings",
    mobile: true,
  },
]);

export const ADMIN_NAV_ITEM = Object.freeze({
  to: ROUTES.ADMIN,
  label: "nav.admin",
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
