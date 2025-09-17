// src/components/payments/CheckoutForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchCustomerBookings, fetchBookingById } from "../../features/bookings/bookingThunks";
import { setBookingPaymentStatusLocally } from "../../features/bookings/bookingSlice";
import CancelPaymentButton from "./CancelPaymentButton";
import Spinner from "../ui/Spinner";
import paymentApi from "../../api/paymentApi";


function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", () => {
      s.setAttribute("data-loaded", "true");
      resolve();
    });
    s.addEventListener("error", (e) => reject(new Error(`Failed to load script ${src}: ${e?.message || e}`)));
    document.head.appendChild(s);
  });
}

function CheckoutInnerPaypal({ orderId, payment }) {
  const paypalContainerRef = useRef(null);
  const buttonsInstanceRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loadingSdk, setLoadingSdk] = useState(true);
  const [sdkError, setSdkError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const bookingId = payment?.bookingId ?? payment?.booking ?? null;
  const displayAmount =
    payment?.displayAmount ??
    payment?.amount ??
    (payment?.amountInPaise ? Number(payment.amountInPaise) / 100 : null) ??
    null;
  const currency = (payment?.currency || "USD").toUpperCase();

  useEffect(() => {
    let mounted = true;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
    if (!clientId) {
      setSdkError(
        "Missing PayPal client id. Set VITE_PAYPAL_CLIENT_ID in your frontend environment (sandbox client id for testing)."
      );
      setLoadingSdk(false);
      return;
    }

    const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=${encodeURIComponent(currency)}&intent=capture`;

    setLoadingSdk(true);
    setSdkError(null);

    loadScript(sdkUrl)
      .then(() => {
        if (!mounted) return;
        if (!window.paypal) {
          setSdkError("PayPal SDK failed to initialize.");
          setLoadingSdk(false);
          return;
        }

        const container = paypalContainerRef.current;
        if (!container) {
          setSdkError("PayPal container not available.");
          setLoadingSdk(false);
          return;
        }

        // cleanup existing 
        if (buttonsInstanceRef.current && typeof buttonsInstanceRef.current.close === "function") {
          try {
            buttonsInstanceRef.current.close();
          } catch (err) {
            console.warn("Error closing previous PayPal buttons instance:", err);
          }
          buttonsInstanceRef.current = null;
        }

        const buttons = window.paypal.Buttons({
          style: { layout: "vertical", color: "blue", shape: "rect", label: "paypal" },
          createOrder: () => orderId,
          onApprove: async () => {
            setProcessing(true);
            try {
              // Capture payment 
              const captureRes = await paymentApi.capturePayment(orderId);

              const providerPaymentId =
                captureRes?.id ??
                (captureRes?.purchase_units &&
                  captureRes.purchase_units[0]?.payments?.captures &&
                  captureRes.purchase_units[0].payments.captures[0]?.id) ??
                orderId;

              dispatch(
                setBookingPaymentStatusLocally({
                  bookingId,
                  paymentStatus: captureRes?.status ?? "succeeded",
                  providerPaymentId,
                  rawCapture: captureRes,
                  capturedAt: new Date().toISOString(),
                })
              );

              // Refresh bookings 
              await dispatch(fetchCustomerBookings());
              if (bookingId) {
                await dispatch(fetchBookingById(bookingId));
              }

              // Navigate to success page
              navigate("/payments/success", {
                replace: true,
                state: {
                  paymentId: payment?.paymentId ?? null,
                  bookingId,
                  amount: displayAmount,
                  currency,
                  fromBookings: true,
                },
              });
            } catch (err) {
              console.error("PayPal capture failed:", err);
              alert("Payment capture failed. Please try again or contact support.");
            } finally {
              setProcessing(false);
            }
          },
          onError: (err) => {
            console.error("PayPal Buttons error:", err);
            alert("PayPal error occurred. Please try again.");
          },
          onCancel: () => {
            if (bookingId) {
              dispatch(fetchBookingById(bookingId)).catch((err) =>
                console.warn("fetchBookingById after PayPal cancel failed:", err)
              );
            }
            alert("Payment cancelled.");
          },
        });

        buttons.render(container);
        buttonsInstanceRef.current = buttons;
        setLoadingSdk(false);
      })
      .catch((err) => {
        console.error("Failed to load PayPal SDK:", err);
        setSdkError("Failed to load PayPal SDK. Check client id and network.");
        setLoadingSdk(false);
      });

    return () => {
      mounted = false;
      if (buttonsInstanceRef.current && typeof buttonsInstanceRef.current.close === "function") {
        try {
          buttonsInstanceRef.current.close();
        } catch (err) {
          console.warn("Error closing PayPal buttons on unmount:", err);
        }
        buttonsInstanceRef.current = null;
      }
    };
  }, [orderId, currency, bookingId, payment, dispatch, navigate, displayAmount]);

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Pay with PayPal</h2>

      {displayAmount != null && (
        <div className="mb-3 text-sm text-slate-700">
          Amount:{" "}
          <span className="font-semibold">
            {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(displayAmount)}
          </span>
        </div>
      )}

      <div className="border p-4 rounded">
        {loadingSdk && (
          <div className="py-6 flex justify-center">
            <Spinner />
          </div>
        )}

        {sdkError && (
          <div className="text-sm text-red-600 py-3">
            {sdkError}
            <div className="mt-2 text-xs text-slate-500">
              Make sure <code>VITE_PAYPAL_CLIENT_ID</code> is set in your frontend environment (sandbox client id).
            </div>
          </div>
        )}

        {/* PayPal buttons mount point */}
        <div ref={paypalContainerRef} />

        {payment?.paymentId && (
          <div className="mt-4">
            <CancelPaymentButton
              paymentId={payment.paymentId}
              providerPaymentId={payment.orderId ?? payment.providerPaymentId ?? payment.raw?.id ?? null}
              paymentStatus={payment.status ?? payment.paymentStatus}
              onCancelled={() => navigate("/bookings", { replace: true, state: { fromBookings: true, bookingId } })}
            />
          </div>
        )}

        {processing && <div className="text-sm text-slate-600 mt-3">Completing payment…</div>}
      </div>
    </div>
  );
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const payment = location.state?.payment ?? null;

  const orderId =
    payment?.orderId ||
    payment?.providerPaymentId ||
    payment?.raw?.id ||
    (payment && payment.raw && (payment.raw.id || payment.raw.orderId)) ||
    null;

  if (!orderId) {
    const bookingId = payment?.bookingId ?? payment?.booking ?? null;
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="bg-yellow-50 border rounded p-6 text-sm text-yellow-800">
          <h3 className="font-semibold mb-2">We couldn’t start the payment</h3>
          <p className="mb-3">
            The payment session is missing a PayPal order id. Please return to{" "}
            <button
              type="button"
              onClick={() => navigate("/dashboard/bookings")}
              className="underline font-semibold"
            >
              My Bookings
            </button>{" "}
            and try again, or contact support if the problem persists.
          </p>
          {bookingId && (
            <div className="text-xs text-slate-600">
              Booking reference: <strong>{bookingId}</strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <CheckoutInnerPaypal orderId={orderId} payment={payment} />;
}
