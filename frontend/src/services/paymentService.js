import { api } from "./api";

const unwrapPayment = (response) => response.data.data.payment;

export const paymentService = {
  checkout: (payload) =>
    api.post("/payments/checkout", payload).then(unwrapPayment),

  get: (txRef) => api.get(`/payments/ref/${txRef}`).then(unwrapPayment),

  verify: (txRef) =>
    api.post(`/payments/ref/${txRef}/verify`, {}).then(unwrapPayment),

  listMine: (params = {}) =>
    api.get("/payments/mine", { params }).then((response) => ({
      payments: response.data.data.payments,
      meta: response.data.meta,
    })),

  listAll: (params = {}) =>
    api.get("/payments", { params }).then((response) => ({
      payments: response.data.data.payments,
      meta: response.data.meta,
    })),
};
