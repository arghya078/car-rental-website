import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

export default function RoleProtected({ allowed = [], children, redirectTo = "/signin" }) {
  const { user, token } = useSelector((s) => s.auth || {});
  const location = useLocation();

  // not logged in
  if (!token) return <Navigate to={redirectTo} replace />;

  // if no role restriction, allow
  if (!allowed.length) return children;

  const role = user?.role;
  if (!role || !allowed.includes(role)) return <Navigate to="/" replace />;

  // if owner
  if (role === "owner") {
    const kycStatus = (user?.kyc?.status ?? "").toLowerCase();

    // If not approved
    if (kycStatus !== "approved") {
      // allow staying on the KYC upload page
      const kycPath = "/owner/kyc";

      if (location.pathname === kycPath) {
        return children; 
      }

      // otherwise send them to the KYC page
      return <Navigate to={kycPath} replace />;
    }
  }

  return children;
}

RoleProtected.propTypes = {
  allowed: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node,
  redirectTo: PropTypes.string,
};
