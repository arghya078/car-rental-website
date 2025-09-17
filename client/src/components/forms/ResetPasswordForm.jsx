
import React from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Mail, Key, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email required"),
  otp: yup.string().required("OTP required"),
  newPassword: yup.string().min(6, "Minimum 6 chars").required("New password required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword"), null], "Passwords must match")
    .required("Confirm password required"),
});

export default function ResetPasswordForm({ onSubmit, loading = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
    defaultValues: { email: "", otp: "", newPassword: "", confirmPassword: "" },
  });

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submitDisabled = loading || isSubmitting;
  const newPasswordVal = watch("newPassword", "");

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 bg-white p-4 rounded-lg shadow-sm max-w-md mx-auto"
      noValidate
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
    >
      {/* Email */}
      <div>
        <label className="text-sm block mb-2 font-medium">Email</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Mail size={16} />
          </span>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className={`w-full border px-3 py-2 rounded pl-10 focus:outline-none focus:ring-2 ${
              errors.email ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
            }`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "reset-email-error" : undefined}
            autoComplete="email"
          />
        </div>

        <AnimatePresence>
          {errors.email && (
            <motion.p
              id="reset-email-error"
              className="text-sm text-red-600 mt-2"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="alert"
              aria-live="polite"
            >
              {errors.email.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* OTP */}
      <div>
        <label className="text-sm block mb-2 font-medium">OTP</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Key size={16} />
          </span>
          <input
            {...register("otp")}
            type="text"
            placeholder="Enter OTP"
            inputMode="numeric"
            className={`w-full border px-3 py-2 rounded pl-10 focus:outline-none focus:ring-2 ${
              errors.otp ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
            }`}
            aria-invalid={!!errors.otp}
            aria-describedby={errors.otp ? "reset-otp-error" : undefined}
          />
        </div>

        <AnimatePresence>
          {errors.otp && (
            <motion.p
              id="reset-otp-error"
              className="text-sm text-red-600 mt-2"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="alert"
              aria-live="polite"
            >
              {errors.otp.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* New password */}
      <div>
        <label className="text-sm block mb-2 font-medium">New password</label>
        <div className="relative">
          <input
            {...register("newPassword")}
            type={showNew ? "text" : "password"}
            placeholder="New password"
            className={`w-full border px-3 py-2 rounded pr-10 focus:outline-none focus:ring-2 ${
              errors.newPassword ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
            }`}
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? "reset-newpass-error" : undefined}
            autoComplete="new-password"
          />

          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 p-1 rounded focus:outline-none"
            aria-label={showNew ? "Hide new password" : "Show new password"}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {newPasswordVal ? `${newPasswordVal.length} / 100` : null}
          </span>
        </div>

        <AnimatePresence>
          {errors.newPassword && (
            <motion.p
              id="reset-newpass-error"
              className="text-sm text-red-600 mt-2"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="alert"
              aria-live="polite"
            >
              {errors.newPassword.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm password */}
      <div>
        <label className="text-sm block mb-2 font-medium">Confirm password</label>
        <div className="relative">
          <input
            {...register("confirmPassword")}
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password"
            className={`w-full border px-3 py-2 rounded pr-10 focus:outline-none focus:ring-2 ${
              errors.confirmPassword ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
            }`}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "reset-confirmpass-error" : undefined}
            autoComplete="new-password"
          />

          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 p-1 rounded focus:outline-none"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {errors.confirmPassword && (
            <motion.p
              id="reset-confirmpass-error"
              className="text-sm text-red-600 mt-2"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="alert"
              aria-live="polite"
            >
              {errors.confirmPassword.message}
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
            Resetting...
          </>
        ) : (
          "Reset password"
        )}
      </motion.button>
    </motion.form>
  );
}

ResetPasswordForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
