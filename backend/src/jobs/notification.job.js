import * as reminderService from "../services/reminderService.js";

export default {
  name: "notification-cleanup",
  schedule: "30 3 * * *",
  run: async (now) => ({
    deleted: await reminderService.purgeOldNotifications(now),
  }),
};
