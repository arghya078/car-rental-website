
import React from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { Mail, Key, LogIn, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = yup.object().shape({
  email: yup.string().email("Enter a valid email address").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export default function LoginForm({ onSubmit, loading = false, serverError = null }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = React.useState(false);
  const passwordValue = watch("password");

  // Local server message 
  const [serverMessage, setServerMessage] = React.useState(serverError || null);

  const submitDisabled = loading || isSubmitting;

  const submitHandler = async (data) => {
    setServerMessage(null); 
    try {
      const res = await onSubmit(data);

      if (res && res.success === false) {
        setServerMessage(res.message || "Login failed. Please try again.");
      } else {
        setServerMessage(null);
      }
    } catch (err) {
      console.error("LoginForm submit error:", err);
      setServerMessage(err?.message || "Login failed. Please try again.");
    }
  };

  React.useEffect(() => {
    setServerMessage(serverError || null);
  }, [serverError]);

  return (
    <motion.form
      onSubmit={handleSubmit(submitHandler)}
      className="max-w-md mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-8 space-y-5"
      noValidate
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome to Car Rental</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage your bookings and rentals</p>
        </div>

        <div className="hidden md:flex items-center text-xs text-slate-400 px-3 py-1 rounded-full border">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Secure login
        </div>
      </div>

      {/* Server message */}
      <AnimatePresence>
        {(serverMessage) && (
          <motion.div
            key="server-msg"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="alert"
            aria-live="polite"
            className="text-sm rounded-md px-3 py-2 border"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 text-red-700 bg-red-50 rounded px-2 py-1">
                {String(serverMessage)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className="text-sm text-slate-600">Email</span>
          <div className="mt-2 relative">
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail size={16} />
            </span>
          </div>
          {errors.email && (
            <p id="email-error" className="text-xs text-red-600 mt-1">
              {errors.email.message}
            </p>
          )}
        </label>

        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Password</span>
            <span className="text-xs text-slate-400">{passwordValue ? `${passwordValue.length} / 100` : null}</span>
          </div>
          <div className="mt-2 relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={`w-full border rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 ${
                errors.password ? "ring-red-300 border-red-400" : "focus:ring-indigo-200 border-gray-200"
              }`}
              placeholder="••••••••"
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
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </label>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-indigo-600 hover:underline text-sm"
          >
            Forgot password?
          </button>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-slate-600 hover:underline text-sm"
          >
            Create account
          </button>
        </div>
      </div>

      <div>
        <motion.button
          type="submit"
          className={`w-full inline-flex items-center justify-center gap-3 font-semibold py-3 rounded-xl shadow-md focus:outline-none focus:ring-2 disabled:opacity-60 ${
            submitDisabled ? "bg-indigo-300 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
          disabled={submitDisabled}
          aria-disabled={submitDisabled}
          whileTap={submitDisabled ? {} : { scale: 0.98 }}
          whileHover={submitDisabled ? {} : { scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="sr-only">Signing in...</span>
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={16} /> <span>Sign in</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="text-center text-xs text-slate-500">
        By signing in you agree to our{" "}
        <a className="text-indigo-600 hover:underline" href="/terms">
          Terms
        </a>{" "}
        and{" "}
        <a className="text-indigo-600 hover:underline" href="/privacy">
          Privacy Policy
        </a>
        .
      </div>
    </motion.form>
  );
}

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  serverError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.node]),
};
