
import React from "react";
import {
  Star,
  Globe,
  CheckCircle,
  Phone,
  ShieldCheck,
  Car,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeInUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="bg-gradient-to-r from-white to-indigo-50 rounded-3xl shadow-lg p-8 md:p-12 overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start gap-8">
          <motion.div variants={fadeInUp} className="flex-shrink-0">
            <div
              className="w-32 h-32 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg,#7c3aed 0%,#06b6d4 100%)",
                boxShadow: "0 18px 50px rgba(99,102,241,0.12)",
              }}
            >
              <Car size={36} color="white" />
            </div>
          </motion.div>

          <div className="flex-1">
            <motion.h1
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight"
            >
              Drives made delightful
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-3 text-slate-600 max-w-2xl leading-relaxed"
            >
              Welcome to our Car Rental Website. We make travel smoother and
              stress-free by providing affordable, reliable, and high-quality
              vehicles — whether it’s for business, leisure, or a last-minute need.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-6 flex flex-wrap gap-3"
            >
              <a
                href="/cars"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white font-medium shadow hover:shadow-lg transition"
              >
                Browse cars
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-slate-700 hover:bg-slate-50 transition"
              >
                Contact support
              </a>
            </motion.div>
          </div>

          <motion.div
            variants={fadeInUp}
            className="hidden md:flex flex-col gap-3 w-56"
          >
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-slate-400">Trusted rating</div>
              <div className="mt-2 flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                <div className="text-lg font-semibold">4.8</div>
                <div className="text-sm text-slate-500">/ 5 (by users)</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-slate-400">Support</div>
              <div className="mt-2 flex items-center gap-2">
                <Phone size={18} />
                <div className="text-sm text-slate-700">24/7 help</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mission & Why Choose Us */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeInUp}
          className="md:col-span-1 bg-white rounded-2xl p-6 shadow-sm border"
        >
          <h2 className="text-lg font-semibold text-slate-800">Our Mission</h2>
          <p className="mt-3 text-slate-600">
            To connect people with the freedom of mobility by offering a
            seamless, secure, and easy-to-use car rental platform. Wherever
            you're heading, we'll get you there with confidence.
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-indigo-50">
                <Globe size={18} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">Global access</div>
                <div className="text-xs text-slate-500">Multiple pick-up locations</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-indigo-50">
                <ShieldCheck size={18} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">Secure & trusted</div>
                <div className="text-xs text-slate-500">Verified owners and secure payments</div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeInUp}
          className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border"
        >
          <h2 className="text-lg font-semibold text-slate-800">Why Choose Us?</h2>

          <motion.ul
            initial="hidden"
            animate="show"
            variants={stagger}
            className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {[
              { title: "Wide vehicle variety", desc: "SUVs, Sedans, Hatchbacks and more", icon: <Car size={18} /> },
              { title: "Affordable pricing", desc: "Transparent day rates and no surprises", icon: <CheckCircle size={18} /> },
              { title: "Verified users & owners", desc: "Manual checks and trusted community", icon: <Users size={18} /> },
              { title: "24/7 customer support", desc: "Real people, fast responses", icon: <Phone size={18} /> },
              { title: "Secure payments", desc: "Sandboxed PayPal + Stripe support", icon: <ShieldCheck size={18} /> },
              { title: "High user rating", desc: "Loved by customers (4.8/5)", icon: <Star size={18} /> },
            ].map((f, i) => (
              <motion.li
                key={i}
                variants={fadeInUp}
                className="flex items-start gap-4 bg-gray-50 rounded-lg p-4 border"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-xs border">
                  <div className="text-indigo-600">{f.icon}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{f.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{f.desc}</div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      </div>

      {/* Team / CTA */}
      <motion.div initial="hidden" animate="show" variants={fadeInUp} className="mt-10 bg-white rounded-2xl p-6 shadow-sm border flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">Ready for a better ride?</h3>
          <p className="text-slate-600 mt-2">Book a car in minutes — great rates, verified owners, and 24/7 support.</p>
        </div>

        <div className="flex gap-3">
          <a
            href="/cars"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold shadow hover:shadow-lg transition"
          >
            Browse cars
          </a>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border text-slate-700 hover:bg-slate-50 transition"
          >
            Contact us
          </a>
        </div>
      </motion.div>
    </div>
  );
}
