
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {useState,useEffect,useRef} from "react";
import {
  fetchCustomerBookings,
  fetchBookingById,
  cancelBookingRequest,
} from "../../features/bookings/bookingThunks";
import { initiatePayment as initiatePaymentThunk } from "../../features/payments/paymentThunks";
import BookingList from "../../components/bookings/BookingList";
import { clearPaymentState } from "../../features/payments/paymentSlice";

export default function MyBookings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    customerBookings = [],
    loading,
    error,
  } = useSelector((s) => s.bookings ?? {});
  const {
    initiating = false,
    initResult = null,
    initiatingError = null,
  } = useSelector((s) => s.payments ?? {});

  const [payingId, setPayingId] = useState(null);

  const handledLocationStateRef = useRef(false);

  // Fetch bookings on mount
  useEffect(() => {
    dispatch(fetchCustomerBookings());
  }, [dispatch]);

  useEffect(() => {
    try {
      if (handledLocationStateRef.current) return;

      const state = location?.state ?? {};
      const cameFromCheckout = Boolean(state.fromCheckout || state.fromBookings);
      const bookingId = state.bookingId;

      if (cameFromCheckout && bookingId) {
        handledLocationStateRef.current = true;

        (async () => {
          try {
            //  refresh the single booking
            await dispatch(fetchBookingById(bookingId)).unwrap?.();

            //  refresh the bookings list
            await dispatch(fetchCustomerBookings()).unwrap?.();
          } catch (e) {
            try {
              await dispatch(fetchCustomerBookings()).unwrap?.();
            } catch (e2) {
              
              console.warn("MyBookings: failed to refresh bookings after checkout", e, e2);
            }
          } finally {
            try {
              navigate(location.pathname, { replace: true, state: {} });
            } catch (navErr) {
              console.warn("MyBookings: failed to clear location state", navErr);
            }
          }
        })();
      }
    } catch (e) {
      console.warn("MyBookings: error handling location state", e);
    }
  }, [location, dispatch, navigate]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    const res = await dispatch(cancelBookingRequest(id));
    if (res.meta.requestStatus === "fulfilled") {
      dispatch(fetchCustomerBookings());
    } else {
      alert(res.payload || res.error?.message || "Cancel failed");
    }
  };

  const handlePay = async (bookingId) => {
    setPayingId(bookingId);

    try {
      const res = await dispatch(initiatePaymentThunk(bookingId));

      if (res.meta.requestStatus === "fulfilled") {
        const payload = res.payload || {};

        // if orderId or providerPaymentId is present
        if (payload.orderId || payload.providerPaymentId) {
          navigate("/payments/checkout", {
            state: { payment: payload, bookingId, fromBookings: true },
          });
          dispatch(clearPaymentState());
          setPayingId(null);
          return;
        }

        if (
          payload.clientSecret ||
          payload.paymentId ||
          payload.stripePaymentId
        ) {
          navigate("/payments/checkout", {
            state: { payment: payload, bookingId, fromBookings: true },
          });
          dispatch(clearPaymentState());
          setPayingId(null);
          return;
        }

        try {
          await dispatch(fetchCustomerBookings()).unwrap?.();
        } catch (e) {
          console.warn("fetchCustomerBookings after payment failed:", e);
        }
        dispatch(clearPaymentState());
        setPayingId(null);
      } else {
        alert(res.payload || res.error?.message || "Payment initiation failed");
        dispatch(clearPaymentState());
        setPayingId(null);
      }
    } catch (e) {
      console.error("handlePay error:", e);
      alert(e?.message || "Payment initiation failed");
      dispatch(clearPaymentState());
      setPayingId(null);
    }
  };

  return (
    <div>
      {/* Payment UI feedback */}
      {(payingId || initiating) && (
        <div className="mb-3 text-sm text-blue-600">
          {payingId
            ? `Initiating payment for booking ${payingId} — please wait...`
            : "Initiating payment — please wait..."}
        </div>
      )}
      {initResult && (
        <div className="mb-3 text-sm text-green-700">
          Payment initiated. {initResult.message || ""}
        </div>
      )}
      {initiatingError && (
        <div className="mb-3 text-sm text-red-600">
          Payment error: {initiatingError}
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <BookingList
          bookings={customerBookings}
          role="customer"
          onCancel={handleCancel}
          onPay={handlePay}
          isPaying={Boolean(payingId)}
          payingId={payingId}
        />
      )}
    </div>
  );
}
