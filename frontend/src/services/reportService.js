import { api } from "./api";

export const reportService = {
  getMyStatement: () =>
    api.get("/reports/me").then((response) => response.data.data.statement),

  getGroupStatement: (groupId) =>
    api
      .get(`/groups/${groupId}/reports/statement`)
      .then((response) => response.data.data.statement),

  getReliability: (groupId) =>
    api
      .get(`/groups/${groupId}/reports/reliability`)
      .then((response) => response.data.data.reliability),
};
