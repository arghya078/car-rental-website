
import React from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

function canonicalBookingStatus(raw) {
  if (raw === null || raw === undefined) return "pending";
  const s = String(raw || "").toLowerCase().trim();
  if (s === "") return "pending";
  if (s === "approved" || /approve|accepted/.test(s)) return "approved";
  if (s === "pending" || /request|pending|waiting/.test(s)) return "pending";
  if (s === "cancelled" || s === "canceled" || /cancel/.test(s)) return "cancelled";
  if (s === "rejected" || /reject/.test(s)) return "rejected";
  if (s === "refunded" || /refund/.test(s)) return "refunded";
  if (s === "paid" || /paid/.test(s)) return "succeeded";
  if (/succeed/.test(s)) return "succeeded";
  return "pending";
}

// currency
const getLocaleForCurrency = (currency) => {
  if (!currency) return navigator.language || "en-US";
  const c = String(currency).toUpperCase();
  if (c === "INR") return "en-IN";
  if (c === "USD") return "en-US";
  return navigator.language || "en-US";
};

const formatCurrencyValue = (value, currency = "USD") => {
  if (value == null) return "-";
  try {
    return new Intl.NumberFormat(getLocaleForCurrency(currency), {
      style: "currency",
      currency: String(currency).toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return String(value);
  }
};


function deriveDisplayAmount(booking) {
  if (!booking) return null;

  // booking.amountInPaise
  if (booking.amountInPaise !== undefined && booking.amountInPaise !== null) {
    const n = Number(booking.amountInPaise);
    if (!Number.isNaN(n)) return n / 100;
  }

  // booking.totalPrice
  if (booking.totalPrice !== undefined && booking.totalPrice !== null) {
    const n2 = Number(booking.totalPrice);
    if (!Number.isNaN(n2)) return n2;
  }

  // payments array (newest)
  if (Array.isArray(booking.payments) && booking.payments.length > 0) {
    const payments = [...booking.payments];
    for (let i = payments.length - 1; i >= 0; i -= 1) {
      const p = payments[i];
      if (!p) continue;
      const pAi = p.amountInPaise ?? p.amountInCents ?? p.amount;
      if (pAi !== undefined && pAi !== null) {
        const pn = Number(pAi);
        if (!Number.isNaN(pn)) {
          if (p.amountInPaise || p.amountInCents) return pn / 100;
          return pn;
        }
      }
    }
  }

  // fallback fields
  const fallback = booking.totalAmount ?? booking.amount ?? null;
  if (fallback !== null && fallback !== undefined) {
    const nf = Number(fallback);
    if (!Number.isNaN(nf)) return nf;
  }

  return null;
}

export default function OwnerBookingRow({ booking, onApprove, onReject, responding = false }) {
  const id = booking._id || booking.id || booking.bookingId;
  const car = booking.car || booking.carDetails || {};
  const customer = booking.customer || booking.user || booking.customerDetails || {};

  const statusRaw = booking.paymentStatus ?? booking.status ?? booking.bookingStatus ?? "pending";
  const statusCanon = canonicalBookingStatus(statusRaw);

  const start = booking.startDate ? dayjs(booking.startDate).format("DD MMM YYYY") : "-";
  const end = booking.endDate ? dayjs(booking.endDate).format("DD MMM YYYY") : "-";

  const displayAmount = deriveDisplayAmount(booking);
  const currency = (booking.currency || car.currency || "USD").toUpperCase();

  const badgeClass =
    statusCanon === "approved"
      ? "bg-green-100 text-green-800"
      : statusCanon === "rejected"
      ? "bg-red-100 text-red-800"
      : statusCanon === "cancelled"
      ? "bg-gray-100 text-gray-800"
      : statusCanon === "succeeded"
      ? "bg-green-100 text-green-800"
      : statusCanon === "refunded"
      ? "bg-slate-100 text-slate-800"
      : "bg-amber-100 text-amber-800";

  const badgeLabel = (() => {
    if (!statusRaw && !statusCanon) return "Pending";
    if (statusCanon === "approved") return "Approved";
    if (statusCanon === "pending") return "Pending";
    if (statusCanon === "rejected") return "Rejected";
    if (statusCanon === "cancelled") return "Cancelled";
    if (statusCanon === "succeeded") return "Paid";
    if (statusCanon === "refunded") return "Refunded";
  
    return String(statusRaw);
  })();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="truncate">
            <div className="font-semibold text-lg truncate">
              {car.brand ?? car.make ?? "Car"} {car.model ?? ""}
            </div>
            <div className="text-sm text-slate-500 mt-1 truncate">Booking #{id}</div>
          </div>

          <div className="flex-shrink-0">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
              {badgeLabel}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-slate-500">Customer</div>
            <div className="text-sm text-slate-800 truncate">
              {customer.name || customer.fullName || customer.email || "—"}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Period</div>
            <div className="text-sm text-slate-800">{start} — {end}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Amount</div>
            <div className="text-sm text-slate-800">
              {displayAmount == null ? "-" : formatCurrencyValue(displayAmount, currency)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-stretch gap-2 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Link
            to={`/bookings/${id}`}
            className="w-full sm:w-auto px-4 py-2 rounded-md border text-sm text-slate-700 hover:bg-gray-50 text-center transition"
          >
            View
          </Link>

          {statusCanon === "pending" && (
            <>
              <button
                type="button"
                onClick={() => onApprove && onApprove(id)}
                disabled={responding}
                aria-disabled={responding}
                className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-300 transition
                  ${responding ? "opacity-60 cursor-not-allowed bg-green-500" : "bg-green-600 hover:bg-green-700"}`}
              >
                {responding ? "Processing..." : "Approve"}
              </button>

              <button
                type="button"
                onClick={() => onReject && onReject(id)}
                disabled={responding}
                aria-disabled={responding}
                className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-300 transition
                  ${responding ? "opacity-60 cursor-not-allowed bg-rose-500" : "bg-rose-600 hover:bg-rose-700"}`}
              >
                {responding ? "Processing..." : "Reject"}
              </button>
            </>
          )}
        </div>

        <div className="text-xs text-slate-500 mt-1 text-right sm:text-left">
          <div>Pickup: <span className="text-slate-700">{car.pickupLocation ?? "-"}</span></div>
        </div>
      </div>
    </div>
  );
}
