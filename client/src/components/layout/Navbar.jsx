// client/src/components/layout/Navbar.jsx
import React from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect,useCallback,useMemo } from "react";
import { logout } from "../../features/auth/authSlice";
import {
  Menu,
  Home,
  Car,
  Info,
  Mail,
  User,
  LogOut,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, token } = useSelector((s) => s.auth || {});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const wrapperRef = React.useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleOutside(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/signin");
  };

  const resolveAvatarSrc = useCallback((u) => {
    if (!u) return null;
    const raw =
      u.profilePic?.url || u.profilePic || u.avatar || u.image || u.photo || null;
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    return `${API_BASE.replace(/\/$/, "")}${raw.startsWith("/") ? raw : "/" + raw}`;
  }, []);

  const avatarSrc = useMemo(() => {
    const resolved = resolveAvatarSrc(user);
    if (resolved) return resolved;
    const name = user?.name || user?.email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=6366f1&color=fff&size=128`;
  }, [user, resolveAvatarSrc]);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 text-sm px-2 py-1 rounded transition-colors ${
      isActive
        ? "text-indigo-600 font-medium"
        : "text-slate-700 hover:text-indigo-600"
    }`;

  // Motion variants
  const itemHover = { scale: 1.04, transition: { type: "spring", stiffness: 320 } };
  const btnHover = { scale: 1.03, boxShadow: "0 14px 40px rgba(15,23,42,0.12)" };

  const menuVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.98 },
    show: { opacity: 1, y: 6, scale: 1, transition: { type: "spring", stiffness: 320, damping: 20 } },
    exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.16 } },
  };

  const mobileVariants = {
    hidden: { opacity: 0, y: -12 },
    show: { opacity: 1, y: 0, transition: { stiffness: 260 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* BRAND */}
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/" className="flex items-center gap-3">
            {/* gradient badge */}
            <motion.div
              whileHover={{ scale: 1.06 }}
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg,#7c3aed 0%,#06b6d4 100%)",
                boxShadow: "0 8px 30px rgba(99,102,241,0.12)",
              }}
            >
              <Car size={25} color="white" />
            </motion.div>

            <div className="flex flex-col leading-tight">
              <motion.span className="text-lg font-semibold text-slate-900">
                CarRental
              </motion.span>
              <motion.span className="text-xs text-slate-500 -mt-0.5">
                Drives made delightful
              </motion.span>
            </div>
          </Link>
        </motion.div>

        {/* NAV LINKS (desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <motion.div whileHover={itemHover}>
            <NavLink to="/" className={navLinkClass} end>
              <Home size={16} /> Home
            </NavLink>
          </motion.div>

          <motion.div whileHover={itemHover}>
            <NavLink to="/cars" className={navLinkClass}>
              <Car size={16} /> Cars
            </NavLink>
          </motion.div>

          <motion.div whileHover={itemHover}>
            <NavLink to="/reviews" className={navLinkClass}>
              <Star size={16} /> Reviews
            </NavLink>
          </motion.div>

          <motion.div whileHover={itemHover}>
            <NavLink to="/about" className={navLinkClass}>
              <Info size={16} /> About
            </NavLink>
          </motion.div>

          <motion.div whileHover={itemHover}>
            <NavLink to="/contact" className={navLinkClass}>
              <Mail size={16} /> Contact
            </NavLink>
          </motion.div>
        </nav>

        {/* RIGHT: auth / profile / mobile toggle */}
        <div className="flex items-center gap-4 relative" ref={wrapperRef}>
          {!token ? (
            <>
              {/* Sign In */}
              <motion.div whileHover={btnHover} className="hidden md:inline-block">
                <NavLink
                  to="/signin"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${
                      isActive
                        ? "text-indigo-600"
                        : "text-slate-600 hover:text-indigo-700 hover:underline"
                    }`
                  }
                >
                  Sign In
                </NavLink>
              </motion.div>

              {/* Sign Up */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <NavLink
                  to="/signup"
                  className="text-sm font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Sign Up
                </NavLink>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                className="hidden md:inline text-sm text-slate-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.06 } }}
              >
                Welcome, <span className="font-medium">{user?.name || "User"}</span>
              </motion.div>

              {/* avatar button */}
              <motion.button
                onClick={() => setProfileOpen((p) => !p)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 p-0 rounded-full focus:outline-none"
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                <img
                  src={avatarSrc}
                  alt={user?.name || user?.email || "User"}
                  className="w-9 h-9 rounded-full object-cover border"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    const n = user?.name || user?.email || "User";
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      n
                    )}&background=6366f1&color=fff&size=128`;
                  }}
                />
              </motion.button>

              {/* profile dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    variants={menuVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute right-0 top-14 w-52 bg-white border rounded-lg shadow-xl py-2 z-50"
                  >
                    <div className="px-2">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/dashboard");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded flex items-center gap-2"
                      >
                        <User size={14} /> My Dashboard
                      </button>

                      <div className="border-t my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded flex items-center gap-2"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Mobile toggle */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setMobileOpen((m) => !m)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="p-2 rounded hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile nav panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial="hidden"
            animate="show"
            exit="exit"
            variants={mobileVariants}
            className="md:hidden bg-white border-t"
          >
            <motion.div
              className="flex flex-col px-4 py-3 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.02 } }}
            >
              <NavLink to="/" end onClick={() => setMobileOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/cars" onClick={() => setMobileOpen(false)}>
                Cars
              </NavLink>
              <NavLink to="/reviews" onClick={() => setMobileOpen(false)}>
                Reviews
              </NavLink>
              <NavLink to="/about" onClick={() => setMobileOpen(false)}>
                About
              </NavLink>
              <NavLink to="/contact" onClick={() => setMobileOpen(false)}>
                Contact
              </NavLink>

              {!token ? (
                <>
                  {/* Mobile Sign In */}
                  <NavLink
                    to="/signin"
                    className="text-sm font-medium text-slate-600 hover:text-indigo-700 hover:underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </NavLink>
                </>
              ) : (
                <>
                  <div className="pt-2 border-t mt-2">
                    <div className="text-sm text-slate-600">
                      Welcome, <span className="font-medium">{user?.name || "User"}</span>
                    </div>

                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/dashboard");
                      }}
                      className="w-full text-left mt-2 flex items-center gap-2"
                    >
                      <User size={16} /> My Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left mt-2 text-rose-600 flex items-center gap-2"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
