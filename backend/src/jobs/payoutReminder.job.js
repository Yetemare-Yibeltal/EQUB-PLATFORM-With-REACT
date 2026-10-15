import * as reminderService from "../services/reminderService.js";

export default {
  name: "payout-reminders",
  schedule: "5 9 * * *",
  run: async (now) => ({
    reminders: await reminderService.sendPayoutReminders(now),
  }),
};
