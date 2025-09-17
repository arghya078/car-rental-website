
import React from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { User, Mail, Key, ChevronDown, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// validation schema
const schema = yup.object().shape({
  name: yup.string().required("Name required"),
  email: yup.string().email("Invalid email").required("Email required"),
  password: yup.string().min(6, "Minimum 6 characters").required("Password required"),
  role: yup.string().oneOf(["customer", "owner"], "Select a valid role").required("Role is required"),
});

export default function RegisterForm({ onSubmit, loading = false, serverError = null }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      role: "customer",
      name: "",
      email: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const passwordValue = watch("password", "");

  const submitDisabled = loading || isSubmitting || !isValid;

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-lg mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-8 space-y-6"
      noValidate
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Create your account</h2>
          <p className="text-sm text-slate-500 mt-1">Register as a Customer or Owner to get started.</p>
        </div>

        <div className="hidden md:flex items-center text-xs text-slate-400 px-3 py-1 rounded-full border">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Secure &amp; quick
        </div>
      </div>

      {/* server message */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            key="server-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="alert"
            aria-live="polite"
            className="text-sm rounded-md p-3 bg-red-50 border border-red-100 text-red-700"
          >
            {String(serverError)}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role select */}
        <label className="block md:col-span-2">
          <span className="text-sm text-slate-600">Register as</span>
          <motion.div
            layout
            className="mt-2 relative"
          >
            <select
              {...register("role")}
              aria-label="Register as"
              className={`appearance-none w-full border rounded-xl px-4 py-2 pr-10 bg-white focus:outline-none focus:ring-2 ${
                errors.role ? "focus:ring-red-200 border-red-300" : "focus:ring-indigo-200 border-gray-200"
              }`}
            >
              <option value="customer">Customer</option>
              <option value="owner">Owner</option>
            </select>

            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown size={16} />
            </span>
          </motion.div>
          {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>}
        </label>

        {/* Name */}
        <label className="block">
          <span className="text-sm text-slate-600">Full name</span>
          <motion.div layout className="mt-2 relative">
            <input
              type="text"
              {...register("name")}
              className={`w-full border rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 ${
                errors.name ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
              }`}
              placeholder="Your full name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <User size={16} />
            </span>
          </motion.div>
          {errors.name && <p id="name-error" className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </label>

        {/* Email */}
        <label className="block">
          <span className="text-sm text-slate-600">Email</span>
          <motion.div layout className="mt-2 relative">
            <input
              type="email"
              {...register("email")}
              className={`w-full border rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 ${
                errors.email ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
              }`}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail size={16} />
            </span>
          </motion.div>
          {errors.email && <p id="email-error" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </label>

        {/* Password */}
        <label className="block">
          <span className="text-sm text-slate-600">Password</span>
          <motion.div layout className="mt-2 relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={`w-full border rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 ${
                errors.password ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
              }`}
              placeholder="Minimum 6 characters"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 p-1 rounded focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {passwordValue ? `${passwordValue.length} / 100` : null}
            </span>
          </motion.div>
          {errors.password && <p id="password-error" className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
        </label>
      </div>

      <div>
        <motion.button
          type="submit"
          className={`w-full inline-flex items-center justify-center gap-3 bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-md focus:outline-none focus:ring-2 disabled:opacity-60 ${
            submitDisabled ? "bg-indigo-300" : "hover:bg-indigo-700"
          }`}
          disabled={submitDisabled}
          aria-disabled={submitDisabled}
          whileTap={submitDisabled ? {} : { scale: 0.985 }}
          whileHover={submitDisabled ? {} : { scale: 1.01 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
        >
          {loading || isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </motion.button>
      </div>

      <div className="text-center text-xs text-slate-500">
        By creating an account you agree to our{" "}
        <a className="text-indigo-600 hover:underline" href="/terms">Terms</a> and{" "}
        <a className="text-indigo-600 hover:underline" href="/privacy">Privacy Policy</a>.
      </div>
    </motion.form>
  );
}

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  serverError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.node]),
};
