
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, DollarSign, Eye, User } from "lucide-react";

export default function CarCard({ car = {}, showOwner = false }) {
  const image = car?.images?.[0]?.url || "/placeholder-car.png";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -6, boxShadow: "0 18px 40px rgba(2,6,23,0.12)" }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200"
      aria-label={`Car card: ${car?.brand || ""} ${car?.model || ""}`}>

      <div className="relative h-48 w-full bg-slate-50">
        <motion.img
          src={image}
          alt={`${car.brand || ""} ${car.model || ""}`}
          loading="lazy"
          initial={{ scale: 1.02 }}
          whileHover={{ scale: 1.06 }}
          className="w-full h-full object-cover"
        />

        {/* badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 text-xs font-medium text-slate-700 shadow">
            <Calendar size={14} />
            <span>{car.year || "—"}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 text-xs font-medium text-slate-700 shadow">
            <MapPin size={14} />
            <span>{car.type || "—"}</span>
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white text-sm font-semibold">
            <DollarSign size={14} />
            <span>${car.rentalPricePerDay ?? "0"}</span>
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm md:text-base font-semibold text-slate-900">
              {car.brand || "Unknown"} <span className="text-slate-500 font-medium">{car.model || ""}</span>
            </h3>
            <div className="mt-1 text-xs text-slate-500">{car.pickupLocation || "Location not set"}</div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-sm md:text-base font-bold text-slate-900">${car.rentalPricePerDay ?? "0"}</div>
            <div className="text-xs text-slate-400">per day</div>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600 line-clamp-3">
          {car.description ? (car.description.length > 140 ? `${car.description.slice(0, 140)}...` : car.description) : 'No description provided.'}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            to={`/cars/${car._id}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label={`View ${car.brand} ${car.model}`}>
            <Eye size={16} />
            View
          </Link>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="inline-flex items-center gap-2">
              <User size={14} />
              <span>{car.seats ? `${car.seats} seats` : '—'}</span>
            </div>

            <div className="inline-flex items-center gap-2">
              <MapPin size={14} />
              <span className="truncate max-w-[8rem]">{car.pickupLocation || '—'}</span>
            </div>
          </div>
        </div>

        {showOwner && car.ownerDetails && (
          <div className="mt-4 border-t pt-3 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
                {(car.ownerDetails.name || "?").slice(0,1).toUpperCase()}
              </div>
            </div>

            <div className="flex-1 text-sm">
              <div className="font-medium text-slate-800">{car.ownerDetails.name}</div>
              <div className="text-xs text-slate-500">{car.ownerDetails.email}</div>
            </div>

            <div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Owner</span>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}
