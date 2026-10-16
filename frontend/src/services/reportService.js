import { api } from "./api";

export const reportService = {
  getMyStatement: () =>
    api.get("/reports/me").then((response) => response.data.data.statement),
};
