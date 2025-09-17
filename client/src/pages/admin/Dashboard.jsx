// src/pages/admin/Dashboard.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingOwners,
  fetchApprovedOwners,
  fetchCustomers,
} from "../../features/admin/adminThunks";
import { Link } from "react-router-dom";
import { Users, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();

  const { pendingOwners = [], approvedOwners = [], customers = [], loading } = useSelector(
    (s) => s.admin ?? {}
  );

  useEffect(() => {
    dispatch(fetchPendingOwners());
    dispatch(fetchApprovedOwners());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchPendingOwners());
    dispatch(fetchApprovedOwners());
    dispatch(fetchCustomers());
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  };

  const stat = (title, value, subtitle, to, Icon, gradient) => (
    <motion.div
      variants={cardVariants}
      whileHover={reduceMotion ? {} : { translateY: -6, scale: 1.01 }}
      className="cursor-pointer"
    >
      <Link to={to} className="block">
        <div
          className={`relative overflow-hidden rounded-2xl p-5 shadow-md transform transition-shadow duration-200 bg-white`}
          role="article"
        >
          {/* gradient accent */}
          <div
            className={`absolute -top-6 -right-12 w-40 h-40 opacity-20 rounded-full ${gradient}`}
            aria-hidden
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">{title}</div>
              <div className="mt-2 flex items-baseline gap-3">
                <div className="text-3xl font-semibold text-slate-900">{value}</div>
                <div className="text-sm text-slate-400">{subtitle}</div>
              </div>
              <div className="mt-2 text-xs text-slate-500">Updated just now</div>
            </div>

            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/60 ring-1 ring-slate-100 shadow-sm">
                {Icon ? <Icon size={20} className="text-slate-700" /> : null}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of owners, customers and quick actions</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
            aria-label="Refresh admin stats"
            title="Refresh"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <AnimatePresence>
        <motion.div
          initial="hidden"
          animate="show"
          exit="hidden"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {stat(
            "Pending Owner Requests",
            loading ? "…" : pendingOwners?.length ?? 0,
            "awaiting review",
            "/admin/owners",
            Clock,
            "from-indigo-400 to-indigo-600 bg-gradient-to-br"
          )}

          {stat(
            "Approved Owners",
            loading ? "…" : approvedOwners?.length ?? 0,
            "active owners",
            "/admin/owners?filter=approved",
            CheckCircle2,
            "from-emerald-400 to-emerald-600 bg-gradient-to-br"
          )}

          {stat(
            "Total Customers",
            loading ? "…" : customers?.length ?? 0,
            "site customers",
            "/admin/customers",
            Users,
            "from-amber-400 to-amber-500 bg-gradient-to-br"
          )}
        </motion.div>
      </AnimatePresence>

      {/* Quick actions + recent summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-800">Recent summary</h3>
            <div className="text-xs text-slate-500">Quick snapshot</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">Pending owner verifications</div>
                <div className="text-xs text-slate-500">{pendingOwners?.length ?? 0} requests awaiting review</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">Active owners</div>
                <div className="text-xs text-slate-500">{approvedOwners?.length ?? 0} owners active on platform</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Users size={18} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">Total customers</div>
                <div className="text-xs text-slate-500">{customers?.length ?? 0} registered customers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col gap-3">
          <h3 className="font-medium">Quick actions</h3>
          <div className="flex flex-col gap-2">
            <Link to="/admin/owners" className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
              Review pending owners
            </Link>
            <Link to="/admin/owners?filter=approved" className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
              See approved owners
            </Link>
            <Link to="/admin/customers" className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
              Manage customers
            </Link>
            <Link to="/admin/bookings" className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
              View bookings
            </Link>
          </div>

          <div className="mt-3 text-xs text-slate-500">Pro tip: Use filters on the Owners page for bulk actions.</div>
        </div>
      </motion.div>
    </div>
  );
}
