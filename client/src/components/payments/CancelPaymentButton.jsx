
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { cancelPayment } from "../../features/payments/paymentThunks";
import { fetchCustomerBookings } from "../../features/bookings/bookingThunks";

export default function CancelPaymentButton({
  paymentId,
  providerPaymentId,
  paymentIntentId,
  paymentStatus,
  onCancelled,
}) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const normalizedStatus = String(paymentStatus ?? "").toLowerCase();
  const isFinal =
    /succeed|succeeded|paid|refunded/i.test(normalizedStatus) ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "cancelled";

  const handleCancel = async () => {
    const hasPaymentRef = paymentId || providerPaymentId || paymentIntentId;
    if (!hasPaymentRef) {
      alert("Missing payment reference.");
      return;
    }

    if (isFinal) {
      alert("This payment is already finalized and cannot be cancelled.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this payment?")) return;

    setLoading(true);
    try {
      const payload = {};
      if (paymentId) {
        payload.paymentId = paymentId;
      } else if (providerPaymentId) {
        payload.providerPaymentId = providerPaymentId;
      } else if (paymentIntentId) {
        payload.providerPaymentId = paymentIntentId;
      }

      const res = await dispatch(cancelPayment(payload));

      if (res?.meta?.requestStatus === "fulfilled") {
        const message =
          (res.payload && (res.payload.message || res.payload.msg)) || "✅ Payment cancelled successfully.";
        alert(message);

        if (typeof onCancelled === "function") {
          try {
            onCancelled(res.payload);
          } catch (cbErr) {
            console.warn("CancelPaymentButton: onCancelled callback threw:", cbErr);
          }
        } else {
          // No callback
          try {
            await dispatch(fetchCustomerBookings());
          } catch (e) {
            console.warn("CancelPaymentButton: fetchCustomerBookings failed:", e);
          }
        }
      } else {
        const serverMsg =
          (res && res.payload && (res.payload.message || res.payload.error || res.payload.msg)) ||
          (res && res.error && (res.error.message || String(res.error))) ||
          "❌ Failed to cancel payment";
        alert(serverMsg);
      }
    } catch (err) {
      console.error("Cancel payment error:", err);
      alert(err?.message || "❌ Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading || isFinal}
      className={`px-3 py-2 rounded text-white transition ${
        loading || isFinal ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
      }`}
      type="button"
    >
      {loading ? "Cancelling..." : "Cancel Payment"}
    </button>
  );
}
