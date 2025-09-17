
import React from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCarById } from "../../features/cars/carThunks";
import BookingForm from "../../components/bookings/BookingForm";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Phone,
  Mail,
  Info,
  Image as ImageIcon,
} from "lucide-react";

// car details
export default function CarDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { car, loading, error } = useSelector((s) => s.cars ?? {});

  React.useEffect(() => {
    if (id) dispatch(fetchCarById(id));
  }, [dispatch, id]);

  const pickFirst = (obj, keys = []) => {
    if (!obj || typeof obj !== "object") return null;
    for (const k of keys) {
      const parts = String(k).split(".");
      let v = obj;
      for (const p of parts) {
        if (v == null) {
          v = undefined;
          break;
        }
        const arrMatch = p.match(/^(\w+)\[(\d+)\]$/);
        if (arrMatch) {
          const key = arrMatch[1];
          const idx = Number(arrMatch[2]);
          v = Array.isArray(v[key]) ? v[key][idx] : undefined;
        } else {
          v = v[p];
        }
      }
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return null;
  };

  const renderImageSrc = (img) => {
    if (!img) return "/placeholder-car.png";
    if (typeof img === "string") return img;
    return img.url || img.secure_url || "/placeholder-car.png";
  };

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [car?.images]);

  if (loading && !car) {
    return (
      <div className="min-h-[240px] flex items-center justify-center">
        <div className="text-slate-500">Loading car details…</div>
      </div>
    );
  }
  if (error)
    return <div className="text-red-600 p-4 rounded bg-red-50">{error}</div>;
  if (!car) return <div className="text-slate-500 p-4">Car not found</div>;

  let rawOwner = car.owner ?? car.ownerDetails ?? null;
  if (Array.isArray(rawOwner)) rawOwner = rawOwner[0] ?? null;
  const owner = rawOwner && typeof rawOwner === "object" ? rawOwner : null;

  const ownerName = pickFirst(owner, [
    "name",
    "fullName",
    "displayName",
    "username",
    "email",
  ]);
  const ownerEmail = pickFirst(owner, ["email", "contactEmail"]);
  const ownerPhone = pickFirst(owner, [
    "phone",
    "mobile",
    "phoneNumber",
    "contact",
    "contactNumber",
  ]);
  const ownerAddress = pickFirst(owner, [
    "address",
    "location",
    "addr",
    "addressLine",
    "address1",
  ]);
  const ownerAvatar = pickFirst(owner, [
    "profilePic.url",
    "profilePic",
    "avatar",
    "picture",
  ]);

  // main image selection
  const images =
    Array.isArray(car.images) && car.images.length
      ? car.images
      : ["/placeholder-car.png"];
  const mainImage = renderImageSrc(images[selectedIndex] ?? images[0]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main content */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          {/* gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            {/* thumbnails */}
            <div className="hidden sm:flex sm:flex-col gap-3 col-span-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`rounded overflow-hidden border transition ${
                    idx === selectedIndex
                      ? "ring-2 ring-indigo-400"
                      : "border-slate-100"
                  }`}
                  aria-label={`Show image ${idx + 1}`}
                >
                  <img
                    src={renderImageSrc(img)}
                    alt={`thumb-${idx}`}
                    className="w-20 h-16 object-cover block"
                    onError={(e) =>
                      (e.currentTarget.src = "/placeholder-car.png")
                    }
                  />
                </button>
              ))}
            </div>

            {/* main image */}
            <div className="col-span-1 sm:col-span-5">
              <AnimatePresence mode="wait">
                <motion.img
                  key={mainImage}
                  src={mainImage}
                  alt={`${car.brand} ${car.model}`}
                  initial={{ opacity: 0, y: 8, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-72 sm:h-96 object-cover rounded"
                  onError={(e) =>
                    (e.currentTarget.src = "/placeholder-car.png")
                  }
                />
              </AnimatePresence>

              {/* basic meta */}
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {car.brand}{" "}
                    <span className="text-slate-500 font-medium">
                      {car.model}
                    </span>
                  </h1>
                  <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} /> {car.year ?? "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} /> {car.pickupLocation || "Unknown"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />{" "}
                      {car.seatingCapacity ?? car.seats ?? "—"} seats
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2 justify-end">
                    <DollarSign size={16} />
                    <span>{car.rentalPricePerDay ?? "—"}</span>
                    <span className="text-sm text-slate-400 font-normal">
                      / day
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Deposit & taxes may apply
                  </div>
                </div>
              </div>

              {/* description */}
              <div className="mt-4 text-slate-700 leading-relaxed">
                {car.description || "No description provided."}
              </div>

              {/* specs / details */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                  <Info size={18} className="text-slate-600" />
                  <div>
                    <div className="text-xs text-slate-500">Transmission</div>
                    <div className="text-sm text-slate-800">
                      {car.transmission || "Auto/Manual"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                  <ImageIcon size={18} className="text-slate-600" />
                  <div>
                    <div className="text-xs text-slate-500">Fuel Type</div>
                    <div className="text-sm text-slate-800">
                      {car.fuelType || "Petrol"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                  <Users size={18} className="text-slate-600" />
                  <div>
                    <div className="text-xs text-slate-500">
                      Seating Capacity
                    </div>
                    <div className="text-sm text-slate-800">
                      {car.seatingCapacity ?? "—"} seats
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                  <MapPin size={18} className="text-slate-600" />
                  <div>
                    <div className="text-xs text-slate-500">
                      Pickup Location
                    </div>
                    <div className="text-sm text-slate-800">
                      {car.pickupLocation || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Booking & Owner */}
        <aside className="bg-white rounded-lg shadow p-5 space-y-4 sticky top-20 self-start">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Price</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <DollarSign size={18} /> {car.rentalPricePerDay ?? "—"}
                <span className="text-sm text-slate-400 font-normal">
                  / day
                </span>
              </div>
            </div>

            <div
              className={`px-2 py-1 rounded-full text-sm font-medium ${
                car.isAvailable
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {car.isAvailable ? "Available" : "Unavailable"}
            </div>
          </div>

          <div className="border-t pt-3">
            {car.isAvailable ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <BookingForm car={car} onBooked={() => {}} />
              </motion.div>
            ) : (
              <div className="text-sm text-slate-500">
                This car is currently unavailable for booking.
              </div>
            )}
          </div>

          <div className="pt-3 border-t">
            <div className="text-sm font-medium mb-2">Owner</div>

            {owner ? (
              <div className="flex items-start gap-3">
                <img
                  src={
                    ownerAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      ownerName || ownerEmail || "Owner"
                    )}&background=6366f1&color=fff&size=64`
                  }
                  alt={ownerName || ownerEmail || "Owner"}
                  className="w-12 h-12 rounded-full object-cover border"
                  onError={(e) =>
                    (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      ownerName || ownerEmail || "Owner"
                    )}&background=6366f1&color=fff&size=64`)
                  }
                />

                <div className="flex-1">
                  <div className="font-medium text-slate-800">
                    {ownerName || ownerEmail || "Unnamed owner"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {ownerAddress || "Address not provided"}
                  </div>

                  <div className="mt-2 flex flex-col gap-2 text-sm">
                    <a
                      className="inline-flex items-center gap-2 text-slate-600"
                      href={`mailto:${ownerEmail || ""}`}
                    >
                      <Mail size={14} />{" "}
                      <span>{ownerEmail || "No public email"}</span>
                    </a>
                    <div className="inline-flex items-center gap-2 text-slate-600">
                      <Phone size={14} />{" "}
                      <span>{ownerPhone || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                No owner details available.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
