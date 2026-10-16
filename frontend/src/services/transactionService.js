import { api } from "./api";

export const transactionService = {
  listByGroup: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/transactions`, { params }).then((response) => ({
      transactions: response.data.data.transactions,
      meta: response.data.meta,
    })),

  summary: (groupId) =>
    api
      .get(`/groups/${groupId}/transactions/summary`)
      .then((response) => response.data.data.summary),
};
