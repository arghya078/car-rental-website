// src/components/layout/AdminSection.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { Layers, Users, Truck, ClipboardList } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

function LinkItem({ to, label, Icon, badge = null, exact = false }) {
  const reduce = useReducedMotion();

  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.24 } },
  };

  return (
    <NavLink to={to} end={exact} className="block">
      {({ isActive }) => (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          whileHover={reduce ? {} : { scale: 1.02 }}
          whileTap={reduce ? {} : { scale: 0.995 }}
          className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150
            ${isActive ? "bg-slate-100 text-indigo-600 font-medium shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
          aria-current={isActive ? "page" : undefined}
        >
          <span className="flex items-center gap-3 min-w-0">
            {Icon ? <Icon size={16} className={`flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-500"}`} /> : null}
            <span className="truncate">{label}</span>
          </span>

          {badge ? (
            <motion.span
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-800"
              title={String(badge)}
            >
              {badge}
            </motion.span>
          ) : null}
        </motion.div>
      )}
    </NavLink>
  );
}

export default function AdminSection() {
  const reduce = useReducedMotion();

  const pendingOwners = useSelector((s) => s.admin?.pendingOwners || []);
  const approvedOwners = useSelector((s) => s.admin?.approvedOwners || []);
  const customers = useSelector((s) => s.admin?.customers || []);

  const adminPendingCount = pendingOwners?.length || 0;
  const adminApprovedCount = approvedOwners?.length || 0;
  const adminCustomersCount = customers?.length || 0;

  const containerVariants = {
    hidden: { opacity: 0, x: -6 },
    show: {
      opacity: 1,
      x: 0,
      transition: { staggerChildren: 0.04, when: "beforeChildren" },
    },
  };

  return (
    <motion.nav
      className="flex flex-col gap-1"
      aria-label="Admin navigation"
      initial="hidden"
      animate="show"
      variants={reduce ? {} : containerVariants}
    >
      <motion.div
        className="text-xs text-slate-500 uppercase px-3 mb-2"
        variants={reduce ? {} : { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.18 } } }}
      >
        Admin
      </motion.div>

      <LinkItem
        to="/admin"
        label="Dashboard"
        Icon={Layers}
        badge={adminPendingCount > 0 ? `${adminPendingCount}` : null}
        exact
      />

      <LinkItem
        to="/admin/owners"
        label="Owners"
        Icon={Users}
        badge={adminPendingCount > 0 || adminApprovedCount > 0 ? `${adminPendingCount} / ${adminApprovedCount}` : null}
      />

      <LinkItem to="/admin/cars" label="Cars" Icon={Truck} exact />

      <LinkItem to="/admin/bookings" label="Bookings" Icon={ClipboardList} />

      <LinkItem
        to="/admin/customers"
        label="Customers"
        Icon={Users}
        badge={adminCustomersCount > 0 ? `${adminCustomersCount}` : null}
      />
    </motion.nav>
  );
}
