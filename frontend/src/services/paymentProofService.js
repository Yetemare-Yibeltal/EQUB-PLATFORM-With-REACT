import { api } from "./api";

const unwrapOne = (response) => response.data.data.proof;

const unwrapList = (response) => ({
  proofs: response.data.data.proofs,
  meta: response.data.meta,
});

const toFormData = ({ screenshot, ...fields }) => {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  form.append("screenshot", screenshot);

  return form;
};

export const paymentProofService = {
  listByGroup: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/payment-proofs`, { params }).then(unwrapList),

  admin: {
    list: (params = {}) =>
      api.get("/admin/payment-proofs", { params }).then(unwrapList),
  },

  submit: (groupId, contributionId, payload) => {
    const url = `/groups/${groupId}/contributions/${contributionId}/proof`;

    if (payload.screenshot) {
      return api
        .post(url, toFormData(payload), {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        })
        .then(unwrapOne);
    }

    return api.post(url, payload).then(unwrapOne);
  },

  screenshot: (groupId, proofId) =>
    api
      .get(`/groups/${groupId}/payment-proofs/${proofId}/screenshot`, {
        responseType: "blob",
      })
      .then((response) => response.data),

  approve: (groupId, proofId) =>
    api
      .post(`/groups/${groupId}/payment-proofs/${proofId}/approve`, {})
      .then(unwrapOne),

  reject: (groupId, proofId, reason) =>
    api
      .post(`/groups/${groupId}/payment-proofs/${proofId}/reject`, { reason })
      .then(unwrapOne),
};
