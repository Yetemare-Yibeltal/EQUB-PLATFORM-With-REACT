import { api } from "./api";

export const cycleService = {
  list: (groupId) =>
    api
      .get(`/groups/${groupId}/cycles`)
      .then((response) => response.data.data.cycles),

  current: (groupId) =>
    api
      .get(`/groups/${groupId}/cycles/current`)
      .then((response) => response.data.data.cycle),

  get: (groupId, cycleId) =>
    api
      .get(`/groups/${groupId}/cycles/${cycleId}`)
      .then((response) => response.data.data.cycle),
};
