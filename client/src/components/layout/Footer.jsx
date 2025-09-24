
import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Twitter, Instagram, Facebook, Car, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const iconHover = { scale: 1.12, rotate: 6, transition: { type: "spring", stiffness: 300 } };
  const linkHover = { x: 4, transition: { duration: 0.18 } };
  const cardHover = { scale: 1.02, boxShadow: "0 18px 50px rgba(2,6,23,0.18)" };

  return (
    <footer className="relative overflow-hidden mt-12">
      {/* Decorative gradient blob */}
      <div className="pointer-events-none absolute right-0 -top-20 -z-10 opacity-25">
        <svg width="420" height="420" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fG1" x1="0" x2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.14" />
            </linearGradient>
          </defs>
          <circle cx="210" cy="210" r="160" fill="url(#fG1)" />
        </svg>
      </div>

      <div className="bg-gradient-to-tr from-slate-900 via-[#0f172a] to-[#071124] text-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Brand & description */}
          <div className="md:col-span-1 space-y-3">
            <motion.div initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 8px 30px rgba(99,102,241,0.12)" }}
                >
                  <Car size={28} color="white"  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">CarRental</h2>
                  <div className="text-xs text-slate-300/90">Drives made delightful</div>
                </div>
              </div>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.06 } }} className="mt-3 text-sm text-slate-300">
              Reliable car rentals for every journey. Cleanly maintained vehicles, transparent pricing, and 24/7 support.
            </motion.p>

            <motion.div className="mt-4 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.12 } }}>
              <motion.a whileHover={iconHover} href="https://twitter.com" aria-label="Twitter" className="p-2 rounded-full bg-white/5">
                <Twitter size={16} />
              </motion.a>
              <motion.a whileHover={iconHover} href="https://instagram.com" aria-label="Instagram" className="p-2 rounded-full bg-white/5">
                <Instagram size={16} />
              </motion.a>
              <motion.a whileHover={iconHover} href="https://facebook.com" aria-label="Facebook" className="p-2 rounded-full bg-white/5">
                <Facebook size={16} />
              </motion.a>
            </motion.div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-white mb-3">Quick links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/", label: "Home" },
                { to: "/cars", label: "Cars" },
                { to: "/about", label: "About" },
                { to: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.to}>
                  <motion.div whileHover={linkHover} className="inline-block">
                    <Link to={l.to} className="text-slate-300 hover:text-white">
                      {l.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Support */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-white mb-3">Support & Legal</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <motion.div whileHover={linkHover} className="inline-block">
                  <Link to="/terms" className="hover:text-white">Terms & Conditions</Link>
                </motion.div>
              </li>
              <li>
                <motion.div whileHover={linkHover} className="inline-block">
                  <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
                </motion.div>
              </li>
              <li className="pt-2">
                <motion.div className="flex items-center gap-2" whileHover={{ x: 4 }}>
                  <ShieldCheck size={16} className="text-emerald-300" />
                  <span className="text-slate-300 text-sm">Secure payments & verified owners</span>
                </motion.div>
              </li>
            </ul>
          </div>

          {/* Contact card */}
          <motion.div
            whileHover={cardHover}
            className="md:col-span-1 bg-gradient-to-br from-white/6 to-white/3 border border-white/6 rounded-2xl p-4"
          >
            <h4 className="font-semibold text-white">Get in touch</h4>

            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-white/6">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="text-slate-200">carpickup247@gmail.com</div>
                  <div className="text-xs text-slate-400">We reply within 24 hours</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-white/6">
                  <Phone size={16} />
                </div>
                <div>
                  <div className="text-slate-200">+91 98765 43210</div>
                  <div className="text-xs text-slate-400">Call / WhatsApp</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-white/6">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="text-slate-200">Mumbai, India</div>
                  <div className="text-xs text-slate-400">Office & pickup locations</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* bottom bar */}
        <div className="border-t border-white/6 py-4">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-400">
            <div>© {new Date().getFullYear()} CarRental. All rights reserved.</div>

            <div className="flex items-center gap-4">
              <motion.a whileHover={iconHover} href="/sitemap" className="text-slate-300 hover:text-white">Sitemap</motion.a>
              <motion.a whileHover={iconHover} href="/help" className="text-slate-300 hover:text-white">Help</motion.a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
