// src/components/bookings/BookingForm.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import {
  createBookingRequest,
  cancelBookingRequest,
  fetchBookingById,
  fetchCustomerBookings,
  initiatePayment as initiateBookingPayment,
} from "../../features/bookings/bookingThunks";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useMemo } from "react";
import { Calendar, Clock, MapPin, XCircle, CheckCircle } from "lucide-react";

const DEFAULT_CURRENCY = (
  import.meta.env.REACT_APP_DEFAULT_CURRENCY || "usd"
).toLowerCase();

// helper
const todayISO = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
})();
const todayAtMidnight = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// validation schema
const schema = yup.object().shape({
  startDate: yup
    .date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .typeError("Please choose a valid start date.")
    .required("Please choose a start date.")
    .min(todayAtMidnight, "Start date can't be in the past."),
  endDate: yup
    .date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .typeError("Please choose a valid end date.")
    .required("Please choose an end date.")
    .test(
      "is-after-start",
      "End date must be after start date.",
      function (value) {
        const { startDate } = this.parent;
        if (!startDate || !value) return false;
        const s = new Date(startDate);
        const e = new Date(value);
        return e > s;
      }
    ),
  pickupLocation: yup.string().nullable(),
});

// canonicalize booking.status
function canonicalBookingStatus(raw) {
  if (!raw) return "pending";
  const s = String(raw).toLowerCase();
  if (/approve|accepted/.test(s)) return "approved";
  if (/pending|request/.test(s)) return "pending";
  if (/cancel/.test(s)) return "cancelled";
  if (/reject/.test(s)) return "rejected";
  if (/refund/.test(s)) return "refunded";
  if (/succeed|paid/.test(s)) return "succeeded";
  return "pending";
}

const getLocaleForCurrency = (currency) => {
  const c = (currency || "").toUpperCase();
  if (c === "INR") return "en-IN";
  if (c === "USD") return "en-US";
  return navigator.language || "en-US";
};
const formatCurrencyValue = (val, currency = DEFAULT_CURRENCY) => {
  if (val == null) return "-";
  try {
    return new Intl.NumberFormat(getLocaleForCurrency(currency), {
      style: "currency",
      currency: String(currency).toUpperCase(),
      maximumFractionDigits: 2,
    }).format(val);
  } catch {
    return String(val);
  }
};

export default function BookingForm({ car, onBooked }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const bookingsState = useSelector((s) => s.bookings ?? {});
  const authState = useSelector((s) => s.auth ?? {});
  const {
    loading: bookingsLoading,
    error: bookingsError,
    message: bookingsMessage,
    paymentInitiating,
  } = bookingsState;

  const initiating = paymentInitiating ?? false;
  const isAuthenticated = Boolean(authState?.token);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setFocus,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      startDate: "",
      endDate: "",
      pickupLocation: car?.pickupLocation || "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  const [topErrorMessage, setTopErrorMessage] = useState(null);
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const calcDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
    const diff = e - s;
    if (diff <= 0) return 0;
    return Math.ceil(diff / MS_PER_DAY);
  }, [startDate, endDate]);

  const estimatedTotal = useMemo(() => {
    const price = Number(car?.rentalPricePerDay || 0);
    const total = calcDays * price * 1.18;
    return Number(total.toFixed(2));
  }, [calcDays, car]);

  const formatDateSafe = (val) => {
    if (!val) return "-";
    try {
      const d = typeof val === "string" ? new Date(val) : val;
      return Number.isNaN(d?.getTime?.())
        ? String(val)
        : d.toLocaleDateString();
    } catch {
      return String(val);
    }
  };

  const onSubmit = (data) => {
    setTopErrorMessage(null);
    if (!car?._id) return alert("Missing car information.");

    const safeCurrency = (car?.currency || DEFAULT_CURRENCY || "usd")
      .toString()
      .toLowerCase();
    const safeEstimatedTotal = Number.isFinite(Number(estimatedTotal))
      ? Number(estimatedTotal)
      : 0;
    const safeAmountInPaise = Math.round(safeEstimatedTotal * 100);

    const normStart = data.startDate || null;
    const normEnd = data.endDate || null;

    const safePayload = {
      carId: car._id,
      startDate: normStart,
      endDate: normEnd,
      pickupLocation: data.pickupLocation || car?.pickupLocation || "",
      totalPrice: safeEstimatedTotal,
      amountInPaise: safeAmountInPaise,
      currency: safeCurrency.toUpperCase(),
    };

    setPendingPayload(safePayload);
    setConfirmOpen(true);
  };

  const onInvalid = (errs) => {
    if (!errs) return;
    const messages = Object.keys(errs)
      .map((k) => errs[k]?.message)
      .filter(Boolean);
    if (!messages.length)
      messages.push("Please correct the highlighted fields.");
    setTopErrorMessage(messages.join(" "));

    const firstKey = Object.keys(errs)[0];
    if (firstKey) {
      try {
        setFocus(firstKey);
      } catch {
        // ignore
      }
    }

    window.clearTimeout(onInvalid._timer);
    onInvalid._timer = window.setTimeout(() => setTopErrorMessage(null), 7000);
  };

  const handleSignInClick = () => {
    const returnTo = location.pathname + (location.search || "");
    navigate("/signin", { state: { returnTo } });
  };

  const onConfirm = async () => {
    setConfirmOpen(false);
    if (!pendingPayload) return;
    if (!isAuthenticated) return handleSignInClick();

    try {
      const res = await dispatch(createBookingRequest(pendingPayload));
      if (res.meta.requestStatus === "fulfilled") {
        const booking = res.payload?.booking ?? res.payload ?? null;
        const id =
          booking?._id ?? booking?.id ?? res.payload?.bookingId ?? null;
        if (id) {
          setBookingId(id);
          setBookingStatus(canonicalBookingStatus(booking?.status));
          startPollingStatus(id);
        } else {
          alert(res.payload?.message || "Booking requested successfully.");
          dispatch(fetchCustomerBookings());
          reset();
        }
        if (typeof onBooked === "function") onBooked(res.payload);
      } else {
        alert(res.payload || res.error?.message || "Booking failed");
      }
    } catch (e) {
      alert(e?.message || "Booking failed");
    } finally {
      setPendingPayload(null);
    }
  };

  const startPollingStatus = (id) => {
    if (!id) return;
    if (pollRef.current) clearInterval(pollRef.current);
    fetchAndApplyStatus(id);
    pollRef.current = setInterval(() => fetchAndApplyStatus(id), 5000);
    setPolling(true);
  };
  const stopPollingStatus = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setPolling(false);
  };
  const fetchAndApplyStatus = async (id) => {
    try {
      const res = await dispatch(fetchBookingById(id));
      if (res.meta.requestStatus === "fulfilled") {
        const booking = res.payload?.booking ?? res.payload ?? null;
        const canon = canonicalBookingStatus(booking?.status);
        setBookingStatus(canon);
        if (
          ["approved", "cancelled", "rejected", "succeeded", "refunded"].includes(
            canon
          )
        )
          stopPollingStatus();
      }
    } catch (err) {
      console.debug("Polling booking status failed:", err?.message || err);
    }
  };

  // ✅ Removed window.confirm
  const handleCancelBooking = async () => {
    if (!bookingId) return;
    if (!isAuthenticated) return handleSignInClick();

    const res = await dispatch(cancelBookingRequest(bookingId));
    if (res.meta.requestStatus === "fulfilled") {
      alert(res.payload?.message || "Booking cancelled");
      setBookingId(null);
      setBookingStatus(null);
      stopPollingStatus();
      dispatch(fetchCustomerBookings());
      reset();
    } else {
      alert(res.payload || res.error?.message || "Failed to cancel booking");
    }
  };

  const handleProceedToPayment = async () => {
    if (!bookingId) return alert("Missing booking reference.");
    if (!isAuthenticated) return handleSignInClick();

    const payAction = await dispatch(initiateBookingPayment(bookingId));
    if (payAction.meta.requestStatus === "fulfilled") {
      const paymentPayload = payAction.payload ?? {};
      const orderId = paymentPayload?.orderId ?? paymentPayload?.raw?.orderId;
      await dispatch(fetchBookingById(bookingId)).catch(() => {});
      if (orderId) {
        navigate("/payments/checkout", {
          state: { payment: paymentPayload, bookingId },
        });
      } else {
        alert(
          paymentPayload?.message ||
            "Payment initiated but no PayPal order returned."
        );
      }
    } else {
      alert(
        payAction.payload ||
          payAction.error?.message ||
          "Failed to initiate payment."
      );
    }
  };

  React.useEffect(() => () => stopPollingStatus(), []);

  const isPending = bookingStatus === "pending";
  const isApproved = bookingStatus === "approved";
  const isCancelled = bookingStatus === "cancelled";
  const isRejected = bookingStatus === "rejected";
  const isPaid = bookingStatus === "succeeded";
  const isRefunded = bookingStatus === "refunded";

  const primaryButtonLabel = (() => {
    if (!bookingId) return "Request";
    if (isPending) return "Cancel";
    if (isApproved) return "Booked (owner accepted)";
    if (isCancelled) return "Booking cancelled";
    if (isRejected) return "Booking rejected";
    if (isPaid) return "Paid";
    if (isRefunded) return "Refunded";
    return "Request";
  })();

  const displayCurrency = (car?.currency || DEFAULT_CURRENCY).toUpperCase();

  return (
    <>
      {/* error banner */}
      {topErrorMessage && (
        <div className="mb-3">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded text-rose-700">
            <XCircle size={20} />
            <div>
              <div className="font-semibold">Please check the form</div>
              <div className="text-sm">{topErrorMessage}</div>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="bg-white p-4 rounded shadow space-y-3"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar size={16} /> Book this car
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className=" text-sm flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Calendar size={14} /> Start date
              </span>
            </label>
            <input
              type="date"
              {...register("startDate")}
              aria-invalid={!!errors.startDate}
              aria-describedby={
                errors.startDate ? "startDate-error" : undefined
              }
              className={`border p-2 rounded w-full ${
                errors.startDate ? "ring-2 ring-rose-200" : ""
              }`}
              min={todayISO}
            />
            {errors.startDate && (
              <div
                id="startDate-error"
                className="text-xs text-rose-600 mt-1 flex items-center gap-2"
              >
                <XCircle size={14} /> {errors.startDate.message}
              </div>
            )}
          </div>

          <div>
            <label className=" text-sm flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Clock size={14} /> End date
              </span>
            </label>
            <input
              type="date"
              {...register("endDate")}
              aria-invalid={!!errors.endDate}
              aria-describedby={errors.endDate ? "endDate-error" : undefined}
              className={`border p-2 rounded w-full ${
                errors.endDate ? "ring-2 ring-rose-200" : ""
              }`}
              min={startDate || todayISO}
            />
            {errors.endDate && (
              <div
                id="endDate-error"
                className="text-xs text-rose-600 mt-1 flex items-center gap-2"
              >
                <XCircle size={14} /> {errors.endDate.message}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className=" text-sm flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <MapPin size={14} /> Pickup location
              </span>
            </label>
            <input
              {...register("pickupLocation")}
              readOnly
              aria-readonly="true"
              className="border p-2 rounded w-full bg-gray-50 cursor-not-allowed"
              value={car?.pickupLocation || ""}
            />
            {errors.pickupLocation && (
              <div className="text-xs text-rose-600 mt-1">
                {errors.pickupLocation.message}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-600">
              Days: <span className="font-medium">{calcDays || 0}</span>
            </div>
            <div className="text-sm text-slate-700">
              Estimated total:{" "}
              <span className="font-semibold">
                {formatCurrencyValue(estimatedTotal, displayCurrency)}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {bookingId && (
                <div>
                  Booking status: <strong>{bookingStatus || "—"}</strong>
                </div>
              )}
              {polling && (
                <div className="text-xs text-amber-700">
                  Waiting for owner response…
                </div>
              )}
              {isCancelled && (
                <div className="text-sm text-rose-600">
                  This booking was cancelled.
                </div>
              )}
              {isRejected && (
                <div className="text-sm text-rose-600">
                  This booking was rejected by the owner.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-slate-600">
                  Sign in to request or pay for a booking.
                </div>
                <Button
                  type="button"
                  onClick={handleSignInClick}
                  variant="primary"
                >
                  Sign in
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {!bookingId && (
                  <Button
                    type="submit"
                    disabled={bookingsLoading || initiating}
                  >
                    {bookingsLoading || initiating
                      ? "Processing..."
                      : primaryButtonLabel}
                  </Button>
                )}

                {bookingId && isPending && (
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    className="px-4 py-2 bg-red-600 text-white rounded-md"
                  >
                    {bookingsLoading ? "Cancelling..." : primaryButtonLabel}
                  </button>
                )}

                {bookingId && isApproved && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md cursor-default"
                    disabled
                  >
                    {primaryButtonLabel}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className={`px-4 py-2 rounded-md text-white ${
                    isApproved
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  disabled={!isApproved || initiating || !bookingId}
                >
                  {initiating ? "Processing..." : "Pay"}
                </button>
              </div>
            )}
          </div>
        </div>

        {bookingsError && (
          <div className="text-sm text-rose-600 flex items-start gap-2">
            <XCircle size={16} /> {bookingsError}
          </div>
        )}
        {bookingsMessage && (
          <div className="text-sm text-emerald-700 flex items-start gap-2">
            <CheckCircle size={16} /> {bookingsMessage}
          </div>
        )}
      </form>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm booking"
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm text-slate-600">Car</div>
            <div className="font-medium">
              {car?.brand} {car?.model}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Dates</div>
            <div>
              {formatDateSafe(pendingPayload?.startDate)} →{" "}
              {formatDateSafe(pendingPayload?.endDate)} ({calcDays || 0} days)
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Pickup</div>
            <div>
              {pendingPayload?.pickupLocation || car?.pickupLocation || "-"}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Estimated total</div>
            <div className="font-semibold">
              {formatCurrencyValue(estimatedTotal, displayCurrency)}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-3 py-2 border rounded"
            >
              Back
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              Confirm & Request Owner
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
