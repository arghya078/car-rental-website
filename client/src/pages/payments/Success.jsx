
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  // Payment info 
  const { paymentId, bookingId, amount, currency } = location.state ?? {};

  // Currency
  const formattedAmount =
    typeof amount === "number"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: (currency || "USD").toUpperCase(),
          maximumFractionDigits: 2,
        }).format(amount)
      : amount ?? "—";

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-semibold mb-3">Payment successful ✅</h2>

      <p className="text-sm text-slate-600 mb-4">
        Thank you — your payment has been processed.
      </p>

      <div className="bg-gray-50 p-4 rounded mb-4">
        <div className="text-sm">Amount</div>
        <div className="font-medium text-lg">{formattedAmount}</div>

        {bookingId && (
          <>
            <div className="text-sm mt-3">Booking ID</div>
            <div className="text-sm">{bookingId}</div>
          </>
        )}

        {paymentId && (
          <>
            <div className="text-sm mt-3">Payment reference</div>
            <div className="text-sm">{paymentId}</div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() =>
            navigate("/dashboard/bookings", {
              replace: true,
              state: { fromBookings: true, bookingId },
            })
          }
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to My Bookings
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
