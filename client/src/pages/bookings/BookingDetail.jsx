// src/pages/bookings/BookingDetail.jsx
import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingById } from "../../features/bookings/bookingThunks";
import CancelPaymentButton from "../../components/payments/CancelPaymentButton";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Car,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Phone,
  Home,
  FileText,
  ArrowLeft,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

function pickFirst(obj, keys = []) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    const parts = String(k).split(".");
    let v = obj;
    for (const p of parts) {
      if (v == null) {
        v = undefined;
        break;
      }
      v = v[p];
    }
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

function normalizeImageUrl(raw) {
  if (!raw) return null;
  if (typeof raw !== "string") return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_BASE}${raw.startsWith("/") ? raw : "/" + raw}`;
}

function canonicalStatus(raw) {
  if (raw === null || raw === undefined) return "pending";
  const s = String(raw || "").toLowerCase().trim();
  if (s === "") return "pending";
  if (/require|processing|pending|needs/.test(s)) return "pending";
  if (/succeed|paid|complete|completed|approved/.test(s)) return "succeeded";
  if (/fail|failed|error/.test(s)) return "failed";
  if (/cancel|cancelled|canceled/.test(s)) return "canceled";
  if (/refund|refunded/.test(s)) return "refunded";
  return "pending";
}

function hasClientSecretMarker(p) {
  if (!p) return false;
  if (typeof p === "string") return false;
  if (p.clientSecret || p.client_secret) return true;
  if (p.raw && (p.raw.client_secret || p.raw.clientSecret)) return true;
  if (p.raw && p.raw.payment_intent && p.raw.payment_intent.client_secret) return true;
  return false;
}

export default function BookingDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const { bookingDetail, detailLoading, loading, error } = useSelector((s) => s.bookings ?? {});
  const isDetailLoading = typeof detailLoading === "boolean" ? detailLoading : loading;

  const handledLocationStateRef = React.useRef(false);

  React.useEffect(() => {
    if (id) dispatch(fetchBookingById(id));
  }, [dispatch, id]);

  React.useEffect(() => {
    try {
      if (handledLocationStateRef.current) return;
      const state = location?.state ?? {};
      const cameFromCheckout = Boolean(state.fromCheckout || state.fromBookings);
      const bookingId = state.bookingId ?? null;

      if (cameFromCheckout && bookingId && String(bookingId) === String(id)) {
        handledLocationStateRef.current = true;

        (async () => {
          try {
            await dispatch(fetchBookingById(id)).unwrap?.();
          } catch (e) {
            console.warn("BookingDetail: failed to refresh booking after checkout", e);
          } finally {
            try {
              navigate(location.pathname, { replace: true, state: {} });
            } catch (navErr) {
              console.warn("BookingDetail: failed to clear location state", navErr);
            }
          }
        })();
      }
    } catch (e) {
      console.warn("BookingDetail: error handling location state", e);
    }
  }, [location, dispatch, id, navigate]);

  const booking = React.useMemo(() => {
    if (!bookingDetail) return null;
    return bookingDetail.booking ?? bookingDetail;
  }, [bookingDetail]);

  const safeFormatDate = React.useCallback((d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "-";
      return dt.toLocaleString();
    } catch {
      return "-";
    }
  }, []);

  // Car normalization
  const { carBrand, carModel, carYear, carType, carSeats, carPickup, carPrice, carImage } =
    React.useMemo(() => {
      if (!booking)
        return { carBrand: null, carModel: null, carYear: null, carType: null, carSeats: null, carPickup: null, carPrice: null, carImage: "/placeholder-car.png" };

      const rawCar = Array.isArray(booking.car) ? booking.car[0] : booking.car || {};
      const brand = pickFirst(rawCar, ["brand", "make"]);
      const model = pickFirst(rawCar, ["model", "name"]);
      const year = pickFirst(rawCar, ["year"]);
      const type = pickFirst(rawCar, ["type"]);
      const seats = pickFirst(rawCar, ["seatingCapacity", "seats"]);
      const pickup = pickFirst(rawCar, ["pickupLocation", "location"]);
      const price = pickFirst(rawCar, ["rentalPricePerDay", "pricePerDay"]);

      let img = "/placeholder-car.png";
      if (Array.isArray(rawCar.images) && rawCar.images.length > 0) {
        const raw = rawCar.images[0]?.url ?? rawCar.images[0];
        img = normalizeImageUrl(raw) || "/placeholder-car.png";
      }

      return { carBrand: brand, carModel: model, carYear: year, carType: type, carSeats: seats, carPickup: pickup, carPrice: price, carImage: img };
    }, [booking]);

  // Owner/Customer normalization
  const { customerName, customerPhone, ownerName, ownerPhone, ownerAddress } = React.useMemo(() => {
    if (!booking) return { customerName: null, customerPhone: null, ownerName: null, ownerPhone: null, ownerAddress: null };

    const cust = booking.customer || {};
    const own = booking.owner || {};

    return {
      customerName: pickFirst(cust, ["name", "email"]),
      customerPhone: pickFirst(cust, ["phone"]),
      ownerName: pickFirst(own, ["name", "email"]),
      ownerPhone: pickFirst(own, ["phone"]),
      ownerAddress: pickFirst(own, ["address"]),
    };
  }, [booking]);

  // Payment normalization
  const paymentObj = React.useMemo(() => {
    if (!booking) return null;
    if (Array.isArray(booking.payments) && booking.payments.length > 0) {
      return booking.payments[booking.payments.length - 1] ?? null;
    }
    return booking.payment ?? null;
  }, [booking]);

  const paymentId = paymentObj?._id ?? booking?.paymentId ?? null;
  const paymentIntentId = paymentObj?.stripePaymentId ?? booking?.stripePaymentId ?? null;

  const paymentCanon = React.useMemo(() => {
    if (hasClientSecretMarker(paymentObj)) return "pending";
    if (hasClientSecretMarker(booking?.payment) || hasClientSecretMarker(booking?.raw) || hasClientSecretMarker(booking?.paymentInit)) {
      return "pending";
    }
    const raw = paymentObj?.status ?? booking?.paymentStatus ?? booking?.status ?? null;
    return canonicalStatus(raw);
  }, [paymentObj, booking]);

  const paymentStatusLabel = React.useMemo(() => {
    if (!paymentCanon) return "Pending Payment";
    if (paymentCanon === "pending") return "Pending";
    if (paymentCanon === "succeeded") return "Paid";
    if (paymentCanon === "failed") return "Failed";
    if (paymentCanon === "canceled") return "Canceled";
    if (paymentCanon === "refunded") return "Refunded";
    return "Pending Payment";
  }, [paymentCanon]);

  const detectedCurrency = (booking?.currency || paymentObj?.currency || "INR").toUpperCase();
  const numberFormatter = React.useMemo(() => {
    const maxFrac = detectedCurrency === "INR" ? 0 : 2;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: detectedCurrency, maximumFractionDigits: maxFrac });
  }, [detectedCurrency]);

  const totalMainUnit = booking?.amountInPaise ? booking.amountInPaise / 100 : booking?.totalPrice ?? null;
  const formattedTotal = totalMainUnit != null ? numberFormatter.format(totalMainUnit) : "—";
  const formattedPerDay = carPrice != null ? numberFormatter.format(carPrice) + "/day" : "—";

  const canCancelPayment = (paymentId || paymentIntentId) && !["succeeded", "refunded", "canceled"].includes(paymentCanon);

  if (isDetailLoading && !booking) return <div className="p-6 text-center">Loading booking...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!booking) return <div className="p-6 text-slate-500">Booking not found.</div>;

  const bookingCanon = canonicalStatus(booking?.status);
  const isConfirmed = bookingCanon === "succeeded" && paymentCanon === "succeeded";

  return (
    <div className="max-w-5xl mx-auto my-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium text-slate-600 hover:bg-gray-50 hover:text-slate-800 transition"
      >
        <ArrowLeft size={16} /> Back to My Bookings
      </button>

      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <FileText size={22} /> Booking Detail
      </h2>

      {isConfirmed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
        >
          <CheckCircle className="text-green-600" size={28} />
          <div>
            <p className="text-lg font-semibold text-green-700">Booking is confirmed!</p>
            <p className="text-sm text-green-600">Thank you for booking with us. Enjoy your ride 🚗</p>
          </div>
        </motion.div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Car size={18} /> Car Details
              </h3>
              <div className="flex items-center gap-4">
                <img src={carImage} alt={`${carBrand} ${carModel}`} className="w-32 h-24 rounded-lg object-cover border" />
                <div className="space-y-1 text-sm text-slate-700">
                  <div className="font-semibold text-base">{carBrand || "Unknown"} {carModel || ""}</div>
                  <div>{carYear ?? "—"} • {carType ?? "—"} • Seats: {carSeats ?? "—"}</div>
                  <div className="flex items-center gap-1"><MapPin size={14} /> {carPickup ?? "Not specified"}</div>
                  <div className="flex items-center gap-1"><DollarSign size={14} /> {formattedPerDay}</div>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Calendar size={18} /> Booking Info
              </h3>
              <div className="space-y-1 text-sm text-slate-700">
                <div className="flex items-center gap-1"><Calendar size={14} /> From: {safeFormatDate(booking.startDate)}</div>
                <div className="flex items-center gap-1"><Calendar size={14} /> To: {safeFormatDate(booking.endDate)}</div>
                <div className="flex items-center gap-1 font-semibold"><DollarSign size={14} /> Total: {formattedTotal}</div>
                <div>Status: <span className="font-medium">{booking.status ?? "—"}</span></div>
                <div>Payment status: <span className="font-medium">{paymentStatusLabel}</span></div>
                {canCancelPayment && (
                  <div className="mt-3">
                    <CancelPaymentButton
                      paymentId={paymentId}
                      paymentIntentId={paymentIntentId}
                      onCancelled={() => dispatch(fetchBookingById(id))}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-6 md:mt-12">
            {/* Customer */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <User size={18} /> Customer
              </h3>
              <div className="space-y-1 text-sm text-slate-700">
                <div>{customerName || "-"}</div>
                {customerPhone && <div className="flex items-center gap-1"><Phone size={14} /> {customerPhone}</div>}
              </div>
            </div>

            {/* Owner */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <User size={18} /> Owner
              </h3>
              <div className="space-y-1 text-sm text-slate-700">
                <div>{ownerName || "-"}</div>
                {ownerPhone && <div className="flex items-center gap-1"><Phone size={14} /> {ownerPhone}</div>}
                {ownerAddress && <div className="flex items-center gap-1"><Home size={14} /> {ownerAddress}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t pt-3 mt-6">
          Booking ID: {booking._id} • Created: {safeFormatDate(booking.createdAt)}
        </div>
      </div>
    </div>
  );
}
