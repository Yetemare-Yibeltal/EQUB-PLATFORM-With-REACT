import { api } from "./api";

export const payoutService = {
  listByGroup: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/payouts`, { params }).then((response) => ({
      payouts: response.data.data.payouts,
      meta: response.data.meta,
    })),

  listMine: (params = {}) =>
    api.get("/payouts/mine", { params }).then((response) => ({
      payouts: response.data.data.payouts,
      meta: response.data.meta,
    })),

  record: (groupId, payoutId, payload) =>
    api
      .post(`/groups/${groupId}/payouts/${payoutId}/pay`, payload)
      .then((response) => response.data.data),
};
