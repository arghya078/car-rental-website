import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import Spinner from './ui/Spinner'; // if you have one

export default function ProtectedRoute({ redirectTo = '/signin' }) {
  const { token, loadingAuth } = useSelector((s) => s.auth || {});

  if (loadingAuth) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  if (!token) return <Navigate to={redirectTo} replace />;
  return <Outlet />;
}
