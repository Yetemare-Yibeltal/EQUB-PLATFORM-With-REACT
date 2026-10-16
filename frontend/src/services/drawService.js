import { api } from "./api";

export const drawService = {
  list: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/draws`, { params }).then((response) => ({
      draws: response.data.data.draws,
      meta: response.data.meta,
    })),

  perform: (groupId, cycleId) =>
    api
      .post(`/groups/${groupId}/draws`, { cycleId })
      .then((response) => response.data.data),
};
