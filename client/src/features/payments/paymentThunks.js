
import { createAsyncThunk } from "@reduxjs/toolkit";
import paymentApi from "../../api/paymentApi";
import { fetchBookingById } from "../bookings/bookingThunks";

// Get token from state or localStorage
const getToken = (maybeGetState) => {
  try {
    const state = typeof maybeGetState === "function" ? maybeGetState() : maybeGetState;
    return state?.auth?.token ?? localStorage.getItem("token") ?? null;
  } catch {
    return localStorage.getItem("token") ?? null;
  }
};

function normalizeInitiateResponse(res) {
  // paymentApi now returns res.data (i.e. the "data" object). Keep tolerant shape:
  const data = res?.data ?? res ?? {};
  const paymentObj = data.payment ?? data.paymentData ?? data.paymentRecord ?? null;

  const toNumberOrNull = (v) => {
    if (v === undefined || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const orderId =
    data.orderId ??
    data.id ??
    (data.order && (data.order.id ?? null)) ??
    (paymentObj && (paymentObj.providerPaymentId ?? paymentObj.orderId ?? null)) ??
    null;

  const paymentId =
    data.paymentId ?? data.id ?? (paymentObj && (paymentObj._id || paymentObj.id)) ?? null;

  const stripePaymentId =
    data.paymentIntentId ?? data.stripePaymentId ?? (paymentObj && (paymentObj.paymentIntentId || paymentObj.stripePaymentId)) ?? null;

  const displayAmount =
    toNumberOrNull(data.displayAmount) ??
    toNumberOrNull(data.amount) ??
    toNumberOrNull(paymentObj && (paymentObj.amount ?? paymentObj.displayAmount)) ??
    null;

  const amountInPaise =
    data.amountInPaise ??
    data.amountInCents ??
    (paymentObj && (paymentObj.amountInPaise ?? paymentObj.amountInCents)) ??
    (displayAmount !== null ? Math.round(displayAmount * 100) : null);

  const currency =
    (data.currency ?? data.currency_code ?? (paymentObj && paymentObj.currency) ?? null)
      ? String(data.currency ?? data.currency_code ?? (paymentObj && paymentObj.currency) ?? "").toLowerCase()
      : null;

  const bookingId =
    data.bookingId ??
    data.booking?.id ??
    data.booking?._id ??
    (paymentObj && (paymentObj.booking ?? paymentObj.bookingId)) ??
    null;

  const status = data.status ?? (paymentObj && paymentObj.status) ?? data.paymentStatus ?? null;
  const clientSecret = data.clientSecret ?? (paymentObj && paymentObj.clientSecret) ?? null;

  return {
    orderId,
    paymentId,
    displayAmount,
    amountInPaise: amountInPaise === undefined ? null : amountInPaise,
    currency,
    clientSecret,
    stripePaymentId,
    status,
    bookingId,
    raw: data,
  };
}

//  Initiate a payment for a booking 
export const initiatePayment = createAsyncThunk(
  "payments/initiate",
  async (bookingId, { rejectWithValue, getState }) => {
    if (!bookingId) {
      return rejectWithValue("bookingId is required to initiate payment");
    }
    try {
      const token = getToken(getState);
      const result = await paymentApi.initiatePayment(bookingId, token);
      return normalizeInitiateResponse(result);
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to initiate payment");
    }
  }
);

// Capture an approved PayPal order on the server
export const capturePayment = createAsyncThunk(
  "payments/capture",
  async ({ orderId, bookingId }, { rejectWithValue, getState, dispatch }) => {
    if (!orderId) {
      return rejectWithValue("orderId is required to capture payment");
    }
    try {
      const token = getToken(getState);
      const payload = await paymentApi.capturePayment(orderId, token);

      if (bookingId) {
        try {
          await dispatch(fetchBookingById(bookingId));
        } catch (e) {
          console.warn("capturePayment: fetchBookingById failed after capture:", e);
        }
      } else {
        const bookingIdFromResp =
          payload?.payment?.booking ?? payload?.bookingId ?? payload?.booking?._id ?? null;
        if (bookingIdFromResp) {
          try {
            await dispatch(fetchBookingById(bookingIdFromResp));
          } catch (e) {
            console.warn("capturePayment: fetchBookingById failed after capture (from response):", e);
          }
        }
      }

      return payload;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to capture payment");
    }
  }
);

// Fetch owner earnings
export const fetchOwnerEarnings = createAsyncThunk(
  "payments/fetchEarnings",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const result = await paymentApi.getOwnerEarnings(token);
      return result;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to fetch earnings");
    }
  }
);

//  Cancel a pending Payment
export const cancelPayment = createAsyncThunk(
  "payments/cancel",
  async (payload, { rejectWithValue, getState }) => {
    if (!payload || typeof payload !== "object") {
      return rejectWithValue("cancelPayment requires a payload object (e.g. { paymentId } or { providerPaymentId })");
    }
    try {
      const token = getToken(getState);
      const result = await paymentApi.cancelPayment(payload, token);
      return result;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to cancel payment");
    }
  }
);

// Refund a succeeded Payment (admin only)
export const refundPayment = createAsyncThunk(
  "payments/refund",
  async (payload, { rejectWithValue, getState }) => {
    if (!payload || typeof payload !== "object") {
      return rejectWithValue(
        "refundPayment requires a payload object (e.g. { paymentId } or { providerPaymentId, captureId, amountPaise })"
      );
    }
    try {
      const token = getToken(getState);
      const result = await paymentApi.refundPayment(payload, token);
      return result;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to refund payment");
    }
  }
);
