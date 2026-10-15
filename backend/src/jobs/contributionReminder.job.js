import * as reminderService from "../services/reminderService.js";

export default {
  name: "contribution-reminders",
  schedule: "0 8 * * *",
  run: async (now) => {
    const reminders = await reminderService.sendContributionReminders(now);
    const overdue = await reminderService.sendOverdueNotices(now);

    return { reminders, overdue };
  },
};
