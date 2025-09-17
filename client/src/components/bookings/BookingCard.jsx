// src/components/bookings/BookingCard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, Clock, FileText } from "lucide-react";

export default function BookingCard({
  booking = {},
  role = "customer",
  onApprove,
  onReject,
  onCancel,
  onPay,
  isPaying = false,
  payingId = null,
  respondingId = null,
}) {
  
  const car = useMemo(() => booking?.car ?? {}, [booking?.car]);
  const customer = useMemo(() => booking?.customer ?? {}, [booking?.customer]);
  const owner = useMemo(() => booking?.owner ?? {}, [booking?.owner]);
  const image = useMemo(
    () => (car?.images && car.images[0]?.url) || "/placeholder-car.png",
    [car?.images]
  );

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      const dt = typeof d === "string" ? new Date(d) : d;
      if (Number.isNaN(dt?.getTime?.())) return String(d);
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  // currency
  const getLocaleForCurrency = (currency) => {
    if (!currency) return navigator.language || "en-US";
    const c = String(currency).toUpperCase();
    if (c === "INR") return "en-IN";
    if (c === "USD") return "en-US";
    return navigator.language || "en-US";
  };

  const formatCurrencyValue = (value) => {
    if (value == null) return "-";
    const defaultCurrency =
      (import.meta.env.REACT_APP_DEFAULT_CURRENCY || "usd").toUpperCase();
    const currency = (
      booking?.currency ||
      car?.currency ||
      defaultCurrency
    ).toUpperCase();
    try {
      return new Intl.NumberFormat(getLocaleForCurrency(currency), {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return String(value);
    }
  };

  const canonicalStatus = (raw) => {
    if (raw == null) return "pending";
    const s = String(raw).toLowerCase().trim();
    if (/created|processing|pending|require|needs/.test(s)) return "pending";
    if (/succeed|succeeded|paid|complete|approved/.test(s)) return "succeeded";
    if (/fail|failed|error|declined/.test(s)) return "failed";
    if (/cancel/.test(s)) return "canceled";
    if (/refund/.test(s)) return "refunded";
    return "pending";
  };

  const bookingPaymentCanon = useMemo(() => {
    try {
      const extractRawStatus = (p) => {
        if (!p) return null;
        const candidates = [p.providerStatus, p.status, p.state, p.raw?.status];
        return (
          candidates.find((v) => v != null && String(v).trim() !== "") ?? null
        );
      };

      if (booking?.payment && typeof booking.payment === "object") {
        return canonicalStatus(extractRawStatus(booking.payment));
      }

      if (Array.isArray(booking?.payments) && booking.payments.length > 0) {
        const p = booking.payments[booking.payments.length - 1];
        if (p) return canonicalStatus(extractRawStatus(p));
      }

      if (booking?.paymentStatus) return canonicalStatus(booking.paymentStatus);
      if (booking?.status) return canonicalStatus(booking.status);

      return "pending";
    } catch {
      return "pending";
    }
  }, [booking]);

  const safeStatus = booking?.status ?? "—";
  const canonBookingStatus = String(safeStatus).toLowerCase();

  const isPaid = bookingPaymentCanon === "succeeded";
  const isCancelledPayment = ["canceled", "failed", "refunded"].includes(
    bookingPaymentCanon
  );

  const isThisPaying = Boolean(
    isPaying && (!payingId || String(payingId) === String(booking?._id))
  );
  const ownerIsResponding = Boolean(
    respondingId && String(respondingId) === String(booking?._id)
  );

  // card styles
  let cardBg = "bg-white";
  let mainBadge = null;
  let showPayButton = false;

  if (canonBookingStatus === "canceled" || canonBookingStatus === "rejected") {
    cardBg = "bg-red-50";
    mainBadge = (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full text-red-700 bg-red-100">
        <XCircle size={14} /> {safeStatus}
      </span>
    );
  } else if (isPaid) {
    cardBg = "bg-green-50";
    mainBadge = (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full text-green-700 bg-green-100">
        <CheckCircle size={14} /> Confirmed
      </span>
    );
  } else if (isCancelledPayment) {
    cardBg = "bg-red-50";
    mainBadge = (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full text-red-700 bg-red-100">
        <XCircle size={14} /> Payment {bookingPaymentCanon}
      </span>
    );
  } else {
    // normal case
    if (canonBookingStatus === "approved") {
      showPayButton = true;
    }
    mainBadge = (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full text-amber-800 bg-amber-100">
        <Clock size={14} /> {safeStatus}
      </span>
    );
  }

  // render
  return (
    <div
      className={`${cardBg} rounded-xl shadow-sm border p-4 flex flex-col md:grid md:grid-cols-3 gap-4 transition`}
    >
      {/* Left: image */}
      <div className="flex items-center md:items-start">
        <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 shadow-sm">
          <img
            src={image}
            alt={`${car?.brand ?? ""} ${car?.model ?? ""}`.trim()}
            className="w-full h-full object-cover"
            onError={(e) => {
              if (e?.currentTarget) {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder-car.png";
              }
            }}
          />
        </div>
      </div>

      {/* Middle: details */}
      <div className="md:col-span-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="text-lg font-semibold truncate">
            {(car?.brand ? `${car.brand} ` : "") +
              (car?.model || car?.title || "")}
          </div>
          <div className="text-sm text-slate-500 mt-1 truncate">
            {car?.pickupLocation ? `${car.pickupLocation} • ` : ""}
            {car?.rentalPricePerDay
              ? `${formatCurrencyValue(car.rentalPricePerDay)}/day`
              : ""}
          </div>

          <div className="mt-3 text-sm text-slate-700 space-y-1">
            <div>
              Dates:{" "}
              <span className="font-medium">
                {formatDate(booking?.startDate)} —{" "}
                {formatDate(booking?.endDate)}
              </span>
            </div>
            <div>
              Total:{" "}
              <span className="font-medium">
                {booking?.totalPrice
                  ? formatCurrencyValue(booking.totalPrice)
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">{mainBadge}</div>
      </div>

      {/* Right: actions */}
      <div className="md:col-span-1 flex flex-col justify-between">
        <div>
          {role === "customer" && (
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-2">
              {canonBookingStatus === "pending" && (
                <button
                  type="button"
                  onClick={() => onCancel?.(booking?._id)}
                  className="w-full sm:w-auto px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                >
                  Cancel
                </button>
              )}

              {showPayButton && !isCancelledPayment && (
                <button
                  type="button"
                  onClick={() => onPay?.(booking?._id)}
                  className={`w-full sm:w-auto px-4 py-2 rounded-md text-white text-sm ${
                    isThisPaying
                      ? "bg-indigo-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                  disabled={isThisPaying}
                >
                  {isThisPaying ? "Processing..." : "Pay"}
                </button>
              )}

              <Link
                to={`/bookings/${booking?._id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-sm font-medium text-slate-700 hover:bg-gray-100 hover:shadow-sm transition"
              >
                <FileText size={16} />
                Booking Details
              </Link>
            </div>
          )}

          {role === "owner" && (
            <div className="mt-2 flex flex-col gap-2">
              {canonBookingStatus === "pending" ? (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove?.(booking?._id)}
                    className={`w-full px-4 py-2 rounded-md text-white text-sm ${
                      ownerIsResponding
                        ? "bg-green-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                    disabled={ownerIsResponding}
                  >
                    {ownerIsResponding ? "Processing..." : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject?.(booking?._id)}
                    className={`w-full px-4 py-2 rounded-md text-white text-sm ${
                      ownerIsResponding
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                    disabled={ownerIsResponding}
                  >
                    {ownerIsResponding ? "Processing..." : "Reject"}
                  </button>
                </>
              ) : (
                <Link
                  to={`/bookings/${booking?._id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-sm font-medium text-slate-700 hover:bg-gray-100 hover:shadow-sm transition"
                >
                  <FileText size={16} />
                  Booking Details
                </Link>
              )}
            </div>
          )}

          {role === "admin" && (
            <div className="mt-2">
              <Link
                to={`/bookings/${booking?._id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-sm font-medium text-slate-700 hover:bg-gray-100 hover:shadow-sm transition"
              >
                <FileText size={16} />
                Booking Details
              </Link>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-slate-500">
          {role === "owner"
            ? `Customer: ${customer?.name || customer?.email || "-"}`
            : `Owner: ${owner?.name || owner?.email || "-"}`}
        </div>
      </div>
    </div>
  );
}
