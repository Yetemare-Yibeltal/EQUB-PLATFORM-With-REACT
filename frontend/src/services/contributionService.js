import { api } from "./api";

const unwrapContribution = (response) => response.data.data.contribution;

export const contributionService = {
  listByGroup: (groupId, params = {}) =>
    api
      .get(`/groups/${groupId}/contributions`, { params })
      .then((response) => ({
        contributions: response.data.data.contributions,
        meta: response.data.meta,
      })),

  listMine: (params = {}) =>
    api.get("/contributions/mine", { params }).then((response) => ({
      contributions: response.data.data.contributions,
      meta: response.data.meta,
    })),

  record: (groupId, contributionId, payload) =>
    api
      .post(`/groups/${groupId}/contributions/${contributionId}/pay`, payload)
      .then(unwrapContribution),

  waive: (groupId, contributionId, reason) =>
    api
      .post(`/groups/${groupId}/contributions/${contributionId}/waive`, {
        reason,
      })
      .then(unwrapContribution),
};
