
import { createSlice } from "@reduxjs/toolkit";
import {
  initiatePayment,
  fetchOwnerEarnings,
  cancelPayment,
  refundPayment,
  capturePayment, 
} from "./paymentThunks";

const initialState = {
  initiating: false,
  initResult: null,
  initiatingError: null,

  // capture flow
  capturing: false,
  captureResult: null,
  captureError: null,

  // cancel flow
  canceling: false,
  cancelResult: null,
  cancelError: null,

  // refund flow
  refunding: false,
  refundResult: null,
  refundError: null,

  // earnings
  earningsLoading: false,
  earnings: { totalEarnings: 0, payments: [] },
  earningsError: null,
};

// canonicalize status
function canonicalStatus(raw) {
  if (raw === null || raw === undefined) return "pending";
  const s = String(raw || "").toLowerCase().trim();
  if (s === "") return "pending";
  if (/require|processing|pending|needs/.test(s)) return "pending";
  if (/succeed|paid/.test(s)) return "succeeded";
  if (/fail|failed/.test(s)) return "failed";
  if (/cancel|cancelled/.test(s)) return "canceled";
  if (/refund|refunded/.test(s)) return "refunded";
  return "pending";
}

// patch initResult
function patchInitResult(initResult, payload) {
  if (!payload) return initResult;

  const out = { ...(initResult || {}), ...(payload || {}) };

  const toNumberOrNull = (v) => {
    if (v === undefined || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  out.orderId =
    out.orderId ??
    payload.orderId ??
    (payload.raw && (payload.raw.orderId || payload.raw.id)) ??
    null;

  out.paymentId =
    out.paymentId ??
    payload.paymentId ??
    payload.id ??
    (payload.payment && (payload.payment._id || payload.payment.id)) ??
    null;

  out.stripePaymentId =
    out.stripePaymentId ??
    payload.stripePaymentId ??
    payload.paymentIntentId ??
    (payload.payment && (payload.payment.stripePaymentId || payload.payment.paymentIntentId)) ??
    null;

  out.displayAmount =
    out.displayAmount ??
    toNumberOrNull(payload.displayAmount) ??
    toNumberOrNull(payload.amount) ??
    (payload.raw && (toNumberOrNull(payload.raw.displayAmount) || toNumberOrNull(payload.raw.amount))) ??
    null;

  out.amountInPaise =
    out.amountInPaise ??
    (payload.amountInPaise ?? payload.amountInCents ?? (out.displayAmount !== null ? Math.round(out.displayAmount * 100) : null)) ??
    null;

  out.currency =
    out.currency ??
    (payload.currency ?? payload.currency_code ?? (payload.raw && (payload.raw.currency || payload.raw.currency_code)) ?? null);

  out.bookingId =
    out.bookingId ??
    payload.bookingId ??
    (payload.booking && (payload.booking._id || payload.booking.id)) ??
    (payload.raw && (payload.raw.bookingId || (payload.raw.booking && (payload.raw.booking._id || payload.raw.booking.id)))) ??
    null;

  out.status = out.status ?? payload.status ?? (payload.payment && payload.payment.status) ?? (payload.raw && payload.raw.status) ?? null;

  out.raw = out.raw ?? payload.raw ?? payload ?? null;

  const rawStatus = out.status ?? null;
  const statusCanon = canonicalStatus(rawStatus);
  const inProgress = !!(out.orderId || out.clientSecret);
  out.statusCanon = inProgress ? "pending" : statusCanon;

  return out;
}

const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearPaymentState(state) {
      state.initiating = false;
      state.initResult = null;
      state.initiatingError = null;
    },
    clearCaptureState(state) {
      state.capturing = false;
      state.captureResult = null;
      state.captureError = null;
    },
    clearCancelState(state) {
      state.canceling = false;
      state.cancelResult = null;
      state.cancelError = null;
    },
    clearRefundState(state) {
      state.refunding = false;
      state.refundResult = null;
      state.refundError = null;
    },
    clearEarningsError(state) {
      state.earningsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // initiatePayment
      .addCase(initiatePayment.pending, (s) => {
        s.initiating = true;
        s.initiatingError = null;
      })
      .addCase(initiatePayment.fulfilled, (s, a) => {
        s.initiating = false;
        const payload = a.payload ?? null;

        if (!payload) {
          s.initResult = null;
          return;
        }

        const rawStatus = payload.status ?? (payload.raw && payload.raw.status) ?? null;
        const statusCanon = canonicalStatus(rawStatus);

        const hasOrderId = !!payload.orderId;
        const hasClientSecret = !!payload.clientSecret;
        const inProgress = hasOrderId || hasClientSecret;

        s.initResult = {
          orderId: payload.orderId ?? null,
          paymentId: payload.paymentId ?? null,
          displayAmount: payload.displayAmount ?? null,
          amountInPaise: payload.amountInPaise ?? null,
          currency: payload.currency ?? null,
          clientSecret: payload.clientSecret ?? null,
          stripePaymentId: payload.stripePaymentId ?? null,
          status: payload.status ?? null,
          bookingId: payload.bookingId ?? null,
          raw: payload.raw ?? null,
          statusCanon: inProgress ? "pending" : statusCanon,
        };

        if (!inProgress && statusCanon === "succeeded") {
          s.initResult.statusCanon = "succeeded";
        }
      })
      .addCase(initiatePayment.rejected, (s, a) => {
        s.initiating = false;
        s.initiatingError = a.payload || a.error?.message || "Failed to initiate payment";
      })

      // capturePayment 
      .addCase(capturePayment.pending, (s) => {
        s.capturing = true;
        s.captureError = null;
      })
      .addCase(capturePayment.fulfilled, (s, a) => {
        s.capturing = false;
        const payload = a.payload ?? null;
        s.captureResult = payload;

        try {
          if (s.initResult && payload) {
            const matches =
              (payload.paymentId && s.initResult.paymentId && String(payload.paymentId) === String(s.initResult.paymentId)) ||
              (payload.orderId && s.initResult.orderId && String(payload.orderId) === String(s.initResult.orderId)) ||
              (payload.payment && payload.payment._id && s.initResult.paymentId && String(payload.payment._id) === String(s.initResult.paymentId)) ||
              (payload.stripePaymentId && s.initResult.stripePaymentId && String(payload.stripePaymentId) === String(s.initResult.stripePaymentId));

            if (matches) {
              s.initResult = patchInitResult(s.initResult, payload);
            }
          } else if (!s.initResult && payload) {
            s.initResult = patchInitResult(null, payload);
          }
        } catch (e) {
          console.warn("paymentSlice: failed to patch initResult on capture response:", e);
        }
      })
      .addCase(capturePayment.rejected, (s, a) => {
        s.capturing = false;
        s.captureError = a.payload || a.error?.message || "Failed to capture payment";
      })

      // fetchOwnerEarnings
      .addCase(fetchOwnerEarnings.pending, (s) => {
        s.earningsLoading = true;
        s.earningsError = null;
      })
      .addCase(fetchOwnerEarnings.fulfilled, (s, a) => {
        s.earningsLoading = false;
        s.earnings = a.payload || { totalEarnings: 0, payments: [] };
      })
      .addCase(fetchOwnerEarnings.rejected, (s, a) => {
        s.earningsLoading = false;
        s.earningsError = a.payload || a.error?.message;
      })

      // cancelPayment
      .addCase(cancelPayment.pending, (s) => {
        s.canceling = true;
        s.cancelError = null;
      })
      .addCase(cancelPayment.fulfilled, (s, a) => {
        s.canceling = false;
        const payload = a.payload ?? null;
        s.cancelResult = payload;

        try {
          if (s.initResult && payload) {
            const matches =
              (payload.paymentId && s.initResult.paymentId && String(payload.paymentId) === String(s.initResult.paymentId)) ||
              (payload.orderId && s.initResult.orderId && String(payload.orderId) === String(s.initResult.orderId)) ||
              (payload.payment && payload.payment._id && s.initResult.paymentId && String(payload.payment._id) === String(s.initResult.paymentId)) ||
              (payload.stripePaymentId && s.initResult.stripePaymentId && String(payload.stripePaymentId) === String(s.initResult.stripePaymentId));

            if (matches) {
              s.initResult = patchInitResult(s.initResult, payload);
            }
          }
        } catch (e) {
          console.warn("paymentSlice: failed to patch initResult on cancel response:", e);
        }
      })
      .addCase(cancelPayment.rejected, (s, a) => {
        s.canceling = false;
        s.cancelError = a.payload || a.error?.message;
      })

      // refundPayment
      .addCase(refundPayment.pending, (s) => {
        s.refunding = true;
        s.refundError = null;
      })
      .addCase(refundPayment.fulfilled, (s, a) => {
        s.refunding = false;
        const payload = a.payload ?? null;
        s.refundResult = payload;

        try {
          if (s.initResult && payload) {
            const matches =
              (payload.paymentId && s.initResult.paymentId && String(payload.paymentId) === String(s.initResult.paymentId)) ||
              (payload.orderId && s.initResult.orderId && String(payload.orderId) === String(s.initResult.orderId)) ||
              (payload.payment && payload.payment._id && s.initResult.paymentId && String(payload.payment._id) === String(s.initResult.paymentId)) ||
              (payload.stripePaymentId && s.initResult.stripePaymentId && String(payload.stripePaymentId) === String(s.initResult.stripePaymentId));

            if (matches) {
              s.initResult = patchInitResult(s.initResult, payload);
            }
          }
        } catch (e) {
          console.warn("paymentSlice: failed to patch initResult on refund response:", e);
        }
      })
      .addCase(refundPayment.rejected, (s, a) => {
        s.refunding = false;
        s.refundError = a.payload || a.error?.message;
      });
  },
});

export const {
  clearPaymentState,
  clearCaptureState,
  clearCancelState,
  clearRefundState,
  clearEarningsError,
} = paymentSlice.actions;
export default paymentSlice.reducer;
