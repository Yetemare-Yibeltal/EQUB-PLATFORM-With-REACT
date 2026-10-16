import { api } from "./api";

const unwrap = (response) => response.data.data;

export const adminService = {
  overview: () =>
    api.get("/admin/overview").then((response) => unwrap(response).overview),

  groups: (params = {}) =>
    api.get("/admin/groups", { params }).then((response) => ({
      groups: response.data.data.groups,
      meta: response.data.meta,
    })),

  auditLogs: (params = {}) =>
    api.get("/admin/audit-logs", { params }).then((response) => ({
      auditLogs: response.data.data.auditLogs,
      meta: response.data.meta,
    })),

  resolvePaymentReview: (paymentId, note) =>
    api
      .post(`/admin/payments/${paymentId}/resolve-review`, { note })
      .then((response) => unwrap(response).payment),

  jobs: () => api.get("/admin/jobs").then((response) => unwrap(response).jobs),

  runJob: (name) => api.post(`/admin/jobs/${name}/run`, {}).then(unwrap),
};
