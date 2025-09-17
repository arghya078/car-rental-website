// src/components/layout/OwnerSection.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { ClipboardList, Truck, PlusCircle, FileText, DollarSign } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

function LinkItem({ to, label, Icon, badge = null, exact = false }) {
  const reduce = useReducedMotion();

  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded"
              title={typeof badge === "string" ? badge : undefined}
            >
              {badge}
            </motion.span>
          ) : null}
        </motion.div>
      )}
    </NavLink>
  );
}

export default function OwnerSection() {
  const reduce = useReducedMotion();

  const ownerPendingRequests = useSelector((s) => s.owners?.pendingRequestsCount || 0);
  const { user } = useSelector((s) => s.auth ?? {});
  const kycStatus = (user?.kyc?.status || "").toString().toLowerCase();

  const kycBadge = (() => {
    if (kycStatus === "approved") return <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">Verified</span>;
    if (kycStatus === "pending") return <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-xs">Pending</span>;
    if (kycStatus === "rejected") return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs">Rejected</span>;
    return <span className="bg-slate-400 text-white px-2 py-0.5 rounded text-xs">Upload</span>;
  })();

  const containerVariants = {
    hidden: { opacity: 0, x: -6 },
    show: {
      opacity: 1,
      x: 0,
      transition: { staggerChildren: 0.035, when: "beforeChildren" },
    },
  };

  return (
    <motion.nav
      className="flex flex-col gap-1"
      aria-label="Owner navigation"
      initial="hidden"
      animate="show"
      variants={reduce ? {} : containerVariants}
    >
      <motion.div
        className="text-xs text-slate-500 uppercase px-3 mb-2"
        variants={reduce ? {} : { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.16 } } }}
      >
        Owner
      </motion.div>

      <LinkItem
        to="/owner/bookings"
        label="Bookings"
        Icon={ClipboardList}
        badge={ownerPendingRequests > 0 ? ownerPendingRequests : null}
        exact
      />

      <LinkItem to="/owner/cars" label="Manage Cars" Icon={Truck} exact />

      <LinkItem to="/owner/cars/add" label="Add Car" Icon={PlusCircle} />

      <LinkItem
        to="/owner/kyc"
        label="KYC Upload"
        Icon={FileText}
        badge={kycBadge}
      />

      <LinkItem to="/owner/earnings" label="Earnings" Icon={DollarSign} />
    </motion.nav>
  );
}
