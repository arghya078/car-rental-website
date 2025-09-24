// client/src/pages/common/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import car1 from "../../assets/car1.jpg";
import car2 from "../../assets/car2.jpeg";
import car3 from "../../assets/car3.jpg";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, when: "beforeChildren" } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const hoverScale = 1.035;
const hoverShadow = "0 18px 40px rgba(15,23,42,0.12)";
const subtleShadow = "0 8px 24px rgba(15,23,42,0.06)";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7fbff] via-[#f3f7ff] to-white py-8 relative">
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center">
        <svg width="900" height="360" viewBox="0 0 900 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
          <defs>
            <linearGradient id="gA" x1="0" x2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.28" />
            </linearGradient>
          </defs>
          <ellipse cx="450" cy="180" rx="420" ry="160" fill="url(#gA)"/>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 relative z-10">
        {/* hero section */}
        <motion.section
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 via-white/70 to-white/50 p-6 sm:p-8 shadow-2xl border"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <motion.div variants={fadeUp} className="space-y-5">
              <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900">
                Drives made delightful — pick a car, pick an adventure.
              </motion.h1>

              <motion.p variants={fadeUp} className="text-slate-600 max-w-xl text-base sm:text-lg">
                Colourful experience, transparent pricing, and hand-inspected vehicles. Short trip or long haul — reserve in seconds and go.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 items-center">
                {/* Browse button */}
                <motion.div
                  whileHover={{ scale: hoverScale, boxShadow: hoverShadow }}
                  whileTap={{ scale: 0.995 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="inline-block"
                >
                  <Link to="/cars" className="inline-flex items-center gap-3 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg text-sm font-semibold shadow-md">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 13.5V9.5C3 8.67 3.67 8 4.5 8h15c.83 0 1.5.67 1.5 1.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 16.5v.75A1 1 0 0 0 8 18.25h.5a1 1 0 0 0 1-1V16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 16.5v.75a1 1 0 0 1-1 1H15.5a1 1 0 0 1-1-1V16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Browse Cars
                  </Link>
                </motion.div>

                {/* Contact button */}
                <motion.div
                  whileHover={{ scale: hoverScale, boxShadow: subtleShadow }}
                  whileTap={{ scale: 0.996 }}
                  transition={{ type: "spring", stiffness: 280 }}
                  className="inline-block"
                >
                  <Link to="/contact" className="inline-flex items-center gap-3 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm font-medium bg-white/60">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 8.5l9 6 9-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 6.5H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Contact Us
                  </Link>
                </motion.div>

                <motion.span
                  whileHover={{ scale: hoverScale * 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="ml-1 inline-flex items-center gap-2 text-xs text-slate-600 bg-gradient-to-r from-[#ffedd5] to-[#fff7ed] px-3 py-2 rounded-full border"
                >
                  <strong className="text-amber-600">New</strong>
                  Early bird discounts — limited time
                </motion.span>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                <motion.div whileHover={{ scale: hoverScale }} transition={{ duration: 0.2 }} className="inline-flex items-center gap-2 bg-white/80 border rounded-md px-3 py-2">
                  <span className="text-indigo-600 font-semibold">Inspected</span>
                  <span className="text-xs">All cars checked</span>
                </motion.div>

                <motion.div whileHover={{ scale: hoverScale }} transition={{ duration: 0.2 }} className="inline-flex items-center gap-2 bg-white/80 border rounded-md px-3 py-2">
                  <span className="text-emerald-600 font-semibold">Flexible</span>
                  <span className="text-xs">Pickup & drop</span>
                </motion.div>

                <motion.div whileHover={{ scale: hoverScale }} transition={{ duration: 0.2 }} className="inline-flex items-center gap-2 bg-white/80 border rounded-md px-3 py-2">
                  <span className="text-sky-600 font-semibold">Support</span>
                  <span className="text-xs">24/7 help</span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right hero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                whileHover={{ scale: hoverScale, boxShadow: hoverShadow }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="rounded-2xl p-3 sm:p-4 shadow-2xl border bg-gradient-to-br from-[#eef2ff] to-white"
              >
                <motion.div whileHover={{ scale: 1.02 }} className="h-36 sm:h-44 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                  Featured: Urban SUV
                </motion.div>

                <motion.div className="mt-3" whileHover={{ scale: 1.01 }}>
                  <div className="font-semibold text-slate-800">Comfort Drive </div>
                  <div className="text-sm text-slate-500">$20 / day • Automatic</div>
                </motion.div>

                <motion.div className="mt-3 flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.04 }}>
                    <Link to="/cars" className="text-sm text-indigo-700 hover:underline">View details</Link>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.04 }} className="ml-auto">
                    <Link to="/cars" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm shadow">
                      Book now
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                whileHover={{ scale: hoverScale, boxShadow: subtleShadow }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: "spring", stiffness: 260 }}
                className="rounded-2xl p-3 sm:p-4 shadow-lg border bg-white"
              >
                <motion.div whileHover={{ scale: 1.02 }} className="">
                  <div className="text-slate-900 font-semibold">Why choose us</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>Transparent pricing — no hidden fees</li>
                    <li>Comprehensive insurance options</li>
                    <li>Easy reschedules & cancellations</li>
                  </ul>
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Avg rating</div>
                    <div className="font-bold text-2xl text-amber-500">4.8 ★</div>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} className="px-3 py-2 rounded-full bg-gradient-to-r from-[#fde68a] to-[#fca5a5] text-sm font-semibold">Popular</motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Features */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: hoverScale, boxShadow: subtleShadow }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-white to-[#f8fafc] rounded-xl border shadow-sm p-4 sm:p-6"
          >
            <div className="font-semibold text-lg text-indigo-700">Huge fleet</div>
            <p className="text-sm text-slate-500 mt-2">Choice across compact, sedan, SUV and luxury categories.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: hoverScale, boxShadow: subtleShadow }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-white to-[#fff7ed] rounded-xl border shadow-sm p-4 sm:p-6"
          >
            <div className="font-semibold text-lg text-amber-600">Instant booking</div>
            <p className="text-sm text-slate-500 mt-2">Reserve fast with quick confirmation and pickup options.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: hoverScale, boxShadow: subtleShadow }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-white to-[#ecfeff] rounded-xl border shadow-sm p-4 sm:p-6"
          >
            <div className="font-semibold text-lg text-sky-600">Support</div>
            <p className="text-sm text-slate-500 mt-2">24/7 customer support and roadside assistance.</p>
          </motion.div>
        </section>

        {/* Popular */}
        <section className="bg-white rounded-2xl border shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Popular picks</h3>
            <motion.div whileHover={{ scale: 1.03 }}>
              <Link to="/cars" className="text-sm text-indigo-600 hover:underline">See all</Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { name: "Compact", img: car1, alt: "Compact car" , accent: "from-[#fef3c7] to-[#fff7ed]" },
              { name: "SUV", img: car2, alt: "SUV car", accent: "from-[#ede9fe] to-[#eef2ff]" },
              { name: "Luxury", img: car3, alt: "Luxury car", accent: "from-[#ffe4e6] to-[#fff1f2]" },
            ].map((t) => (
              <motion.div
                key={t.name}
                whileHover={{ scale: 1.035, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: "spring", stiffness: 260 }}
                className="rounded-xl overflow-hidden border bg-white"
              >
                <div className="h-28 sm:h-36 relative w-full">
                  <img
                    src={t.img}
                    alt={t.alt}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-3 sm:p-4">
                  <div className="font-semibold">{t.name} rides</div>
                  <div className="text-sm text-slate-500 mt-1">Starting from ₹999/day</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-gradient-to-r from-white to-[#f8fafc] rounded-2xl border shadow p-4 sm:p-6">
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-between text-center">
            <motion.div whileHover={{ scale: hoverScale }} className="cursor-default">
              <div className="text-2xl font-bold text-indigo-700">10k+</div>
              <div className="text-xs text-slate-500">Customers</div>
            </motion.div>

            <motion.div whileHover={{ scale: hoverScale }} className="cursor-default">
              <div className="text-2xl font-bold text-emerald-600">2k+</div>
              <div className="text-xs text-slate-500">Cars</div>
            </motion.div>

            <motion.div whileHover={{ scale: hoverScale }} className="cursor-default">
              <div className="text-2xl font-bold text-sky-600">24/7</div>
              <div className="text-xs text-slate-500">Support</div>
            </motion.div>

            <motion.div whileHover={{ scale: hoverScale }} className="cursor-default">
              <div className="text-2xl font-bold text-amber-500">4.8</div>
              <div className="text-xs text-slate-500">Rating</div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
