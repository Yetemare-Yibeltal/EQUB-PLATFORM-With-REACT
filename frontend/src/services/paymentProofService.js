import { api } from "./api";

const unwrapOne = (response) => response.data.data.proof;

export const paymentProofService = {
  listByGroup: (groupId, params = {}) =>
    api
      .get(`/groups/${groupId}/payment-proofs`, { params })
      .then((response) => ({
        proofs: response.data.data.proofs,
        meta: response.data.meta,
      })),

  submit: (groupId, contributionId, payload) =>
    api
      .post(`/groups/${groupId}/contributions/${contributionId}/proof`, payload)
      .then(unwrapOne),

  approve: (groupId, proofId) =>
    api
      .post(`/groups/${groupId}/payment-proofs/${proofId}/approve`, {})
      .then(unwrapOne),

  reject: (groupId, proofId, reason) =>
    api
      .post(`/groups/${groupId}/payment-proofs/${proofId}/reject`, { reason })
      .then(unwrapOne),
};
