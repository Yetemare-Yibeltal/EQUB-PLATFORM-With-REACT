import { api } from "./api";

const unwrap = (response) => response.data.data;

export const memberService = {
  list: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/members`, { params }).then((response) => ({
      members: response.data.data.members,
      meta: response.data.meta,
    })),

  approve: (groupId, memberId) =>
    api.post(`/groups/${groupId}/members/${memberId}/approve`, {}).then(unwrap),

  reject: (groupId, memberId) =>
    api.post(`/groups/${groupId}/members/${memberId}/reject`, {}).then(unwrap),

  remove: (groupId, memberId) =>
    api.delete(`/groups/${groupId}/members/${memberId}`),
};
