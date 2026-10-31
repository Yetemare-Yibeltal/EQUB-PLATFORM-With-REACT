import account from "./account";
import admin from "./admin";
import adminPages from "./adminPages";
import base from "./base";
import cycles from "./cycles";
import detail from "./detail";
import groups from "./groups";
import home from "./home";
import money from "./money";
import notices from "./notices";
import record from "./record";
import reports from "./reports";
import shared from "./shared";

export default {
  ...notices,
  ...adminPages,
  ...admin,
  ...account,
  ...reports,
  ...record,
  ...base,
  ...shared,
  ...groups,
  ...home,
  ...cycles,
  ...detail,
  ...money,
};
