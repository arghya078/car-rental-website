
import axios from "./axiosInstance";

const withAuth = (token) => ({ headers: token ? { Authorization: `Bearer ${token}` } : {} });

async function request(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    const normalized = err?.response?.data ?? { message: err?.message ?? "Request failed" };
    normalized.__original = err;
    throw normalized;
  }
}

const initiatePayment = (bookingId, token) => {
  if (!bookingId) return Promise.reject(new Error("initiatePayment: bookingId is required"));
  return request(axios.post(`/payments/initiate/${bookingId}`, {}, withAuth(token)));
};


const capturePayment = (orderId, token) => {
  if (!orderId) return Promise.reject(new Error("capturePayment: orderId is required"));
  return request(axios.post("/payments/capture", { orderId }, withAuth(token)));
};


const cancelPayment = (payload, token) => {
  if (!payload || typeof payload !== "object")
    return Promise.reject(
      new Error("cancelPayment: payload object is required (e.g. { paymentId } or { providerPaymentId })")
    );
  return request(axios.post("/payments/cancel", payload, withAuth(token)));
};


const refundPayment = (payload, token) => {
  if (!payload || typeof payload !== "object")
    return Promise.reject(
      new Error(
        "refundPayment: payload object is required (e.g. { paymentId } or { providerPaymentId, captureId, amountPaise })"
      )
    );
  return request(axios.post("/payments/refund", payload, withAuth(token)));
};


const getOwnerEarnings = (token) => request(axios.get("/payments/owner/earnings", withAuth(token)));

export default {
  initiatePayment,
  capturePayment,
  cancelPayment,
  refundPayment,
  getOwnerEarnings,
};
