import account from "./account";
import admin from "./admin";
import base from "./base";
import cycles from "./cycles";
import detail from "./detail";
import groups from "./groups";
import home from "./home";
import money from "./money";
import record from "./record";
import reports from "./reports";
import shared from "./shared";

export default {
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
