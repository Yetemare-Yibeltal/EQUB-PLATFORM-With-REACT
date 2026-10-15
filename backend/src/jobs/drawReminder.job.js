import * as reminderService from "../services/reminderService.js";

export default {
  name: "draw-reminders",
  schedule: "0 9 * * *",
  run: async (now) => ({
    reminders: await reminderService.sendDrawReminders(now),
  }),
};
