import { api } from "./api";

const unwrap = (response) => response.data.data;

export const groupService = {
  list: (params = {}) =>
    api.get("/groups", { params }).then((response) => ({
      groups: response.data.data.groups,
      meta: response.data.meta,
    })),

  create: (payload) =>
    api.post("/groups", payload).then((response) => unwrap(response).group),

  preview: (inviteCode) =>
    api
      .get(`/groups/preview/${encodeURIComponent(inviteCode)}`)
      .then((response) => unwrap(response).group),

  join: (inviteCode) => api.post("/groups/join", { inviteCode }).then(unwrap),

  get: (groupId) =>
    api.get(`/groups/${groupId}`).then((response) => unwrap(response).group),

  update: (groupId, payload) =>
    api
      .patch(`/groups/${groupId}`, payload)
      .then((response) => unwrap(response).group),

  cancel: (groupId, reason) =>
    api
      .post(`/groups/${groupId}/cancel`, reason ? { reason } : {})
      .then((response) => unwrap(response).group),

  regenerateInviteCode: (groupId) =>
    api
      .post(`/groups/${groupId}/invite-code/regenerate`, {})
      .then((response) => unwrap(response).inviteCode),

  leave: (groupId) => api.post(`/groups/${groupId}/leave`, {}),

  start: (groupId) => api.post(`/groups/${groupId}/start`, {}).then(unwrap),

  auditLogs: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/audit-logs`, { params }).then((response) => ({
      auditLogs: response.data.data.auditLogs,
      meta: response.data.meta,
    })),
};
