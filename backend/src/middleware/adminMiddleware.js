import { USER_ROLES } from "../constants/roles.js";
import { restrictTo } from "./authMiddleware.js";

export const requireAdmin = restrictTo(USER_ROLES.ADMIN);

export default requireAdmin;
