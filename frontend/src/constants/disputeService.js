import { api } from "./api";

const unwrapList = (response) => ({
  disputes: response.data.data.disputes,
  meta: response.data.meta,
});

const unwrapOne = (response) => response.data.data.dispute;

export const disputeService = {
  listByGroup: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/disputes`, { params }).then(unwrapList),

  get: (groupId, disputeId) =>
    api.get(`/groups/${groupId}/disputes/${disputeId}`).then(unwrapOne),

  create: (groupId, payload) =>
    api.post(`/groups/${groupId}/disputes`, payload).then(unwrapOne),

  comment: (groupId, disputeId, body) =>
    api
      .post(`/groups/${groupId}/disputes/${disputeId}/comments`, { body })
      .then(unwrapOne),

  decide: (groupId, disputeId, payload) =>
    api
      .post(`/groups/${groupId}/disputes/${disputeId}/decision`, payload)
      .then(unwrapOne),

  admin: {
    list: (params = {}) =>
      api.get("/admin/disputes", { params }).then(unwrapList),

    get: (disputeId) => api.get(`/admin/disputes/${disputeId}`).then(unwrapOne),

    comment: (disputeId, body) =>
      api
        .post(`/admin/disputes/${disputeId}/comments`, { body })
        .then(unwrapOne),

    decide: (disputeId, payload) =>
      api
        .post(`/admin/disputes/${disputeId}/decision`, payload)
        .then(unwrapOne),
  },
};
