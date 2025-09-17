
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const location = useLocation();

  // Simple mapping for my helpful page titles
  const titles = {
    '/dashboard': 'Account Overview',
    '/dashboard/profile': 'My Profile',
    '/dashboard/bookings': 'My Bookings',
    '/owner': 'Owner Dashboard',
    '/owner/cars': 'Manage Cars',
    '/owner/bookings': 'Owner Bookings',
    '/owner/kyc': 'KYC Upload',
    '/owner/cars/add': 'Add Car',
    '/admin': 'Admin Dashboard',
    '/admin/owners': 'All Owners',
    '/admin/cars': 'All Cars',
    '/admin/bookings': 'All Bookings',
  };

  // If path doesn't match exactly, try prefix matches for dynamic routes
  const pathname = location.pathname;
  let title = titles[pathname] || 'Dashboard';

  // prefix-based titles for dynamic routes
  if (!title) {
    if (pathname.startsWith('/admin/owners/')) title = 'Owner details';
    else if (pathname.startsWith('/owner/cars/edit/')) title = 'Edit Car';
    else if (pathname.startsWith('/owner/cars')) title = 'Manage Cars';
    else if (pathname.startsWith('/dashboard')) title = 'Account Overview';
  }

  return (
    <div className="min-h-[80vh] bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-4">
            <Sidebar />
          </div>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-9">
          <div className="bg-white rounded shadow-sm p-4">
            {/* Page header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold">{title}</h1>
              {/* optional action slot: put buttons here if a child page needs them */}
            </div>

            {/* Nested page content */}
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
