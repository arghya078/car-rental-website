
import { createSlice } from "@reduxjs/toolkit";
import {
  createBookingRequest,
  cancelBookingRequest,
  fetchCustomerBookings,
  fetchOwnerPendingBookings,
  fetchOwnerBookingsWithPayments,
  respondToBooking,
  fetchAllBookingsForAdmin,
  initiatePayment,
  fetchBookingById,
} from "./bookingThunks";

const initialState = {
  customerBookings: [],
  ownerPending: [],
  ownerAll: [],
  adminBookings: [],
  bookingDetail: null,
  loading: false, 
  detailLoading: false, 
  error: null,
  message: null,
  paymentInit: null,
  paymentInitiating: false, 
};

function canonicalStatus(raw) {
  if (raw === undefined || raw === null) return "pending";

  const s = String(raw || "").toLowerCase().trim();
  if (s === "") return "pending";
  if (/require|processing|pending|needs/.test(s)) return "pending";
  if (/succeed|paid|complete|completed|approved/.test(s)) return "succeeded";
  if (/fail|failed/.test(s)) return "failed";
  if (/cancel|cancelled/.test(s)) return "canceled";
  if (/refund|refunded/.test(s)) return "refunded";
  return "pending";
}

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    clearBookingError(state) {
      state.error = null;
    },
    clearBookingMessage(state) {
      state.message = null;
    },
    clearPaymentInit(state) {
      state.paymentInit = null;
    },
    clearBookingDetail(state) {
      state.bookingDetail = null;
      state.detailLoading = false;
    },

    setBookingPaymentStatusLocally(state, action) {
      try {
        const { bookingId, paymentStatus, providerPaymentId, rawCapture, capturedAt } =
          action.payload || {};
        if (!bookingId) return;

        const canonical = canonicalStatus(paymentStatus ?? "succeeded");

        const patchBooking = (b) => {
          if (!b) return b;
          const newB = { ...b };

          newB.payment = { ...(newB.payment || {}) };

          if (providerPaymentId) newB.payment.providerPaymentId = providerPaymentId;
          newB.payment.status = canonical;
          newB.payment.paymentStatus = canonical;
          if (rawCapture) newB.payment.raw = rawCapture;
          if (capturedAt) newB.payment.capturedAt = capturedAt;

          newB.paymentStatus = canonical;

          return newB;
        };

        if (Array.isArray(state.customerBookings) && state.customerBookings.length) {
          const idx = state.customerBookings.findIndex(
            (b) => String(b._id ?? b.id) === String(bookingId)
          );
          if (idx >= 0) {
            state.customerBookings[idx] = patchBooking(state.customerBookings[idx]);
          }
        }

        if (Array.isArray(state.ownerAll) && state.ownerAll.length) {
          const idxO = state.ownerAll.findIndex((b) => String(b._id ?? b.id) === String(bookingId));
          if (idxO >= 0) {
            state.ownerAll[idxO] = patchBooking(state.ownerAll[idxO]);
          }
        }

        if (Array.isArray(state.adminBookings) && state.adminBookings.length) {
          const idxA = state.adminBookings.findIndex((b) => String(b._id ?? b.id) === String(bookingId));
          if (idxA >= 0) {
            state.adminBookings[idxA] = patchBooking(state.adminBookings[idxA]);
          }
        }

        if (state.bookingDetail && String(state.bookingDetail._id ?? state.bookingDetail.id) === String(bookingId)) {
          state.bookingDetail = patchBooking(state.bookingDetail);
        }
      } catch (e) {
        console.warn("setBookingPaymentStatusLocally failed:", e);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      //create booking
      .addCase(createBookingRequest.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(createBookingRequest.fulfilled, (s, a) => {
        s.loading = false;
        s.error = null;

        s.message = a.payload?.message || "Booking request created";

        const maybeBooking = a.payload?.booking ?? (Array.isArray(a.payload) ? null : a.payload);
        if (maybeBooking && typeof maybeBooking === "object") {
          s.customerBookings = s.customerBookings || [];
          const id = String(maybeBooking._id ?? maybeBooking.id);
          if (!s.customerBookings.find((b) => String(b._id ?? b.id) === id)) {
            s.customerBookings.unshift(maybeBooking);
          }
        }
      })
      .addCase(createBookingRequest.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message || "Failed to create booking";
      })

      //cancel booking
      .addCase(cancelBookingRequest.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(cancelBookingRequest.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload?.message || "Booking cancelled";
        s.error = null;
      })
      .addCase(cancelBookingRequest.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message || "Failed to cancel booking";
      })

      //fetch customer bookings
      .addCase(fetchCustomerBookings.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(fetchCustomerBookings.fulfilled, (s, a) => {
        s.loading = false;
        s.customerBookings = Array.isArray(a.payload) ? a.payload : a.payload?.bookings ?? [];
        s.error = null;
      })
      .addCase(fetchCustomerBookings.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message || "Failed to fetch customer bookings";
      })

     //fetch owner pending
      .addCase(fetchOwnerPendingBookings.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(fetchOwnerPendingBookings.fulfilled, (s, a) => {
        s.loading = false;
        s.ownerPending = Array.isArray(a.payload) ? a.payload : a.payload?.bookings ?? [];
        s.error = null;
      })
      .addCase(fetchOwnerPendingBookings.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message || "Failed to fetch owner pending bookings";
      })

      //fetch owner bookings
      .addCase(fetchOwnerBookingsWithPayments.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(fetchOwnerBookingsWithPayments.fulfilled, (s, a) => {
        s.loading = false;
        s.ownerAll = Array.isArray(a.payload) ? a.payload : a.payload?.bookings ?? [];
        s.error = null;
      })
      .addCase(fetchOwnerBookingsWithPayments.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message || "Failed to fetch owner bookings";
      })

      //respond to booking
      .addCase(respondToBooking.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(respondToBooking.fulfilled, (s, a) => {
        s.loading = false;
        s.error = null;
        s.message = a.payload?.message || "Booking updated";

        const updatedBooking = a.payload?.booking ?? a.payload ?? null;
        if (updatedBooking) {
          const id = String(updatedBooking._id ?? updatedBooking.id);

          if (Array.isArray(s.ownerPending)) {
            s.ownerPending = s.ownerPending.filter((b) => String(b._id ?? b.id) !== id);
          }

          s.ownerAll = s.ownerAll || [];
          const idx = s.ownerAll.findIndex((b) => String(b._id ?? b.id) === id);
          if (idx >= 0) {
            s.ownerAll[idx] = { ...s.ownerAll[idx], ...updatedBooking };
          } else {
            s.ownerAll.unshift(updatedBooking);
          }
        }
      })
      .addCase(respondToBooking.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message || "Failed to update booking";
      })

      //fetch admin bookings
      .addCase(fetchAllBookingsForAdmin.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(fetchAllBookingsForAdmin.fulfilled, (s, a) => {
        s.loading = false;
        s.adminBookings = Array.isArray(a.payload) ? a.payload : a.payload ?? [];
        s.error = null;
      })
      .addCase(fetchAllBookingsForAdmin.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message || "Failed to fetch admin bookings";
      })

      //initiate payment
      .addCase(initiatePayment.pending, (s) => {
        s.paymentInitiating = true;
        s.error = null;
        s.paymentInit = null;
        s.message = null;
      })
      .addCase(initiatePayment.fulfilled, (s, a) => {
        s.paymentInitiating = false;
        s.paymentInit = a.payload ?? null;
        s.error = null;

        try {
          const payload = a.payload ?? {};
       
          const bookingFromPayload = payload.booking ?? payload.raw?.booking ?? null;

          const rawStatus =
            payload.status ??
            payload.paymentStatus ??
            (payload.raw && payload.raw.payment && payload.raw.payment.status) ??
            (payload.raw && payload.raw.status) ??
            null;

          const statusCanon = canonicalStatus(rawStatus);
          const hasOrderId = !!(payload.orderId || (payload.raw && (payload.raw.orderId || payload.raw.id)));

          if (bookingFromPayload) {
            const bookingObj = bookingFromPayload;
            const incomingPaymentStatus =
              bookingObj?.paymentStatus ?? bookingObj?.payment?.status ?? bookingObj?.status ?? null;
            const normalizedIncoming = canonicalStatus(incomingPaymentStatus);

            if (
              s.bookingDetail &&
              String(s.bookingDetail._id ?? s.bookingDetail.id) === String(bookingObj._id ?? bookingObj.id)
            ) {
              s.bookingDetail = { ...bookingObj, paymentStatus: normalizedIncoming };
            }

            // Update customerBookings 
            if (Array.isArray(s.customerBookings)) {
              const idx = s.customerBookings.findIndex(
                (b) => String(b._id ?? b.id) === String(bookingObj._id ?? bookingObj.id)
              );
              if (idx >= 0) {
                s.customerBookings[idx] = {
                  ...s.customerBookings[idx],
                  ...bookingObj,
                  paymentStatus: normalizedIncoming,
                };
              } else {
                s.customerBookings.unshift({ ...bookingObj, paymentStatus: normalizedIncoming });
              }
            }
          }

          const bookingId =
            payload.bookingId ||
            payload.booking?._id ||
            payload.booking?.id ||
            payload.payment?.booking ||
            payload.payment?.bookingId ||
            null;

          if (bookingId) {
            const idx = s.customerBookings.findIndex((b) => String(b._id ?? b.id) === String(bookingId));
            if (statusCanon === "succeeded" && !hasOrderId) {
              if (idx >= 0) s.customerBookings[idx] = { ...s.customerBookings[idx], paymentStatus: statusCanon };
              if (s.bookingDetail && String(s.bookingDetail._id ?? s.bookingDetail.id) === String(bookingId)) {
                s.bookingDetail = { ...s.bookingDetail, paymentStatus: statusCanon };
              }
            } else if (statusCanon === "pending") {
              if (idx >= 0) s.customerBookings[idx] = { ...s.customerBookings[idx], paymentStatus: "pending" };
              if (s.bookingDetail && String(s.bookingDetail._id ?? s.bookingDetail.id) === String(bookingId)) {
                s.bookingDetail = { ...s.bookingDetail, paymentStatus: "pending" };
              }
            } else if (statusCanon === "failed" && !hasOrderId) {
              if (idx >= 0) s.customerBookings[idx] = { ...s.customerBookings[idx], paymentStatus: "failed" };
              if (s.bookingDetail && String(s.bookingDetail._id ?? s.bookingDetail.id) === String(bookingId)) {
                s.bookingDetail = { ...s.bookingDetail, paymentStatus: "failed" };
              }
            }
          }
        } catch (e) {
          console.warn("initiatePayment.fulfilled failed:", e);
        }
      })
      .addCase(initiatePayment.rejected, (s, a) => {
        s.paymentInitiating = false;
        s.error = a.payload || a.error?.message || "Failed to initiate payment";
      })

      // fetch booking detail
      .addCase(fetchBookingById.pending, (s) => {
        s.detailLoading = true;
        s.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (s, a) => {
        s.detailLoading = false;
        const payload = a.payload;
        const fetched = payload?.booking ?? payload ?? null;
        if (fetched) {
          const incomingPaymentStatus =
            fetched?.paymentStatus ?? fetched?.payment?.status ?? fetched?.status ?? null;
          const normalizedIncoming = canonicalStatus(incomingPaymentStatus);
          s.bookingDetail = { ...fetched, paymentStatus: normalizedIncoming };
        } else {
          s.bookingDetail = null;
        }
        s.error = null;
      })
      .addCase(fetchBookingById.rejected, (s, a) => {
        s.detailLoading = false;
        s.error = a.payload || a.error?.message || "Failed to fetch booking detail";
      });
  },
});

export const {
  clearBookingError,
  clearBookingMessage,
  clearPaymentInit,
  clearBookingDetail,
  setBookingPaymentStatusLocally,
} = bookingSlice.actions;

export default bookingSlice.reducer;
