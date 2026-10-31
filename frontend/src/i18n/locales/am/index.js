import base from "./base";
import cycles from "./cycles";
import detail from "./detail";
import groups from "./groups";
import home from "./home";
import money from "./money";
import shared from "./shared";

export default {
  ...base,
  ...shared,
  ...groups,
  ...home,
  ...cycles,
  ...detail,
  ...money,
};
