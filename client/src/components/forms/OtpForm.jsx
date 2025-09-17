
import React from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Mail, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email required"),
  otp: yup.string().required("OTP required"),
});

export default function OtpForm({ onSubmit, loading = false, defaultEmail = "" }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: defaultEmail, otp: "" },
    mode: "onTouched",
  });

  const submitDisabled = loading || isSubmitting;

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 bg-white p-4 rounded-lg shadow-sm max-w-md mx-auto"
      noValidate
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
    >
      <div>
        <label className="text-sm block mb-2 font-medium">Email</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Mail size={16} />
          </span>
          <input
            name="email"
            type="email"
            {...register("email")}
            className={`w-full border px-3 py-2 rounded pl-10 focus:outline-none focus:ring-2 ${
              errors.email ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
            }`}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "otp-email-error" : undefined}
            autoFocus={!defaultEmail}
            defaultValue={defaultEmail || undefined}
          />
        </div>

        <AnimatePresence>
          {errors.email && (
            <motion.p
              id="otp-email-error"
              className="text-sm text-red-600 mt-2"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              role="alert"
              aria-live="polite"
            >
              {errors.email.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label className="text-sm block mb-2 font-medium">OTP</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Key size={16} />
          </span>
          <input
            name="otp"
            type="text"
            {...register("otp")}
            className={`w-full border px-3 py-2 rounded pl-10 focus:outline-none focus:ring-2 ${
              errors.otp ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
            }`}
            placeholder="Enter OTP"
            aria-invalid={!!errors.otp}
            aria-describedby={errors.otp ? "otp-code-error" : undefined}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
          />
        </div>

        <AnimatePresence>
          {errors.otp && (
            <motion.p
              id="otp-code-error"
              className="text-sm text-red-600 mt-2"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              role="alert"
              aria-live="polite"
            >
              {errors.otp.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        type="submit"
        className={`w-full inline-flex items-center justify-center gap-3 bg-indigo-600 text-white py-2 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 disabled:opacity-60 ${
          submitDisabled ? "bg-indigo-300" : "hover:bg-indigo-700"
        }`}
        disabled={submitDisabled}
        aria-disabled={submitDisabled}
        whileTap={submitDisabled ? {} : { scale: 0.985 }}
        whileHover={submitDisabled ? {} : { scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {submitDisabled ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Verifying...
          </>
        ) : (
          "Verify OTP"
        )}
      </motion.button>
    </motion.form>
  );
}

OtpForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  defaultEmail: PropTypes.string,
};
