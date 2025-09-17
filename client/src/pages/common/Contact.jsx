// src/pages/common/Contact.jsx
import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Facebook, Twitter, Instagram } from "lucide-react";

export default function Contact() {
  return (
    <motion.div
      className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 space-y-8 text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.h1
        className="text-3xl font-bold text-slate-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Contact Us
      </motion.h1>

      <p className="text-slate-600 max-w-md mx-auto">
        Have a question or need help? Reach us directly using the details below.
      </p>

      {/* Contact Info */}
      <div className="space-y-4">
        <motion.div
          className="flex items-center justify-center gap-3 text-lg text-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Mail className="text-blue-600" size={22} />
          <span>carpickup247@gmail.com</span>
        </motion.div>

        <motion.div
          className="flex items-center justify-center gap-3 text-lg text-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Phone className="text-green-600" size={22} />
          <span>+91 98765 43210</span>
        </motion.div>
      </div>

      {/* Social Media */}
      <motion.div
        className="pt-6 border-t space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-slate-600 text-sm">Follow us on social media</p>
        <div className="flex justify-center gap-6">
          <a href="https://facebook.com" target="_blank" rel="noreferrer">
            <Facebook className="text-blue-600 hover:text-blue-800 transition" size={26} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">
            <Twitter className="text-sky-500 hover:text-sky-600 transition" size={26} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            <Instagram className="text-pink-500 hover:text-pink-600 transition" size={26} />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
