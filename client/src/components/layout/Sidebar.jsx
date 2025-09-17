// src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { Home, User, Calendar, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import OwnerSection from "./OwnerSection";
import AdminSection from "./AdminSection";

/* Motion helpers */
const containerVariants = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.03, when: "beforeChildren" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

function LinkItem({ to, label, Icon, badge = null, exact = false }) {
  return (
    <NavLink to={to} end={exact} className="block">
      {({ isActive }) => (
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.99 }}
          className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150
            ${isActive ? "bg-slate-100 text-indigo-600 font-medium shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
          aria-current={isActive ? "page" : undefined}
        >
          <span className="flex items-center gap-3 min-w-0">
            {Icon ? (
              <Icon
                size={16}
                className={`flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-500"}`}
              />
            ) : null}
            <span className="truncate">{label}</span>
          </span>

          {badge ? (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded">
              {badge}
            </span>
          ) : null}
        </motion.div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((s) => s.auth ?? {});
  const role = (user?.role || "customer").toString().toLowerCase();

  const handleLogout = () => {
    try {
      dispatch(logout());
    } catch (e) {
      console.warn("Logout failed", e);
    }
    navigate("/", { replace: true });
  };

  const initials = React.useMemo(() => {
    const name = user?.name || user?.email || "U";
    return String(name)
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("");
  }, [user]);

  return (
    <aside className="bg-white rounded p-3 shadow-sm">
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="space-y-3"
      >
        {/* Profile area */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 px-1 py-2 mb-2"
          aria-hidden={false}
        >
          <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center text-indigo-700 font-semibold"
          >
            {initials}
          </motion.div>

          <div className="min-w-0">
            <motion.div
              variants={itemVariants}
              className="font-semibold truncate text-slate-800"
            >
              {user?.name ?? user?.email ?? "User"}
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="text-xs text-slate-500 mt-0.5"
            >
              Role: <span className="capitalize">{role}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* common nav */}
        <nav className="flex flex-col gap-1 mb-3" aria-label="Main navigation">
          <div className="text-xs text-slate-500 uppercase px-3 mb-2">Main</div>

          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <LinkItem to="/dashboard" label="Overview" Icon={Home} exact />
            <LinkItem to="/dashboard/profile" label="Profile" Icon={User} />
            <LinkItem to="/dashboard/bookings" label="My Bookings" Icon={Calendar} />
          </motion.div>
        </nav>

        <hr className="my-3 border-t" />

        {/* ROLE SPECIFIC (owner / admin) */}
        <AnimatePresence>
          {role === "owner" && (
            <motion.div
              key="owner-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <OwnerSection />
            </motion.div>
          )}

          {role === "admin" && (
            <motion.div
              key="admin-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <AdminSection />
            </motion.div>
          )}
        </AnimatePresence>

        <hr className="my-3 border-t" />

        {/* Sign out */}
        <motion.div variants={itemVariants} className="px-3">
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-colors duration-150 shadow-sm"
            aria-label="Sign out"
            type="button"
            whileTap={{ scale: 0.98 }}
            whileHover={{ translateY: -2 }}
          >
            <LogOut size={16} className="text-white" />
            <span>Sign out</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </aside>
  );
}
