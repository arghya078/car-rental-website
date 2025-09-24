
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// auth pages
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Login from "./pages/auth/Login";
import ResetPasswordWithOtp from "./pages/auth/ResetPasswordWithOtp";
import ForgotPassword from "./pages/auth/ForgotPassword";

// common pages
import Home from "./pages/common/Home";
import Cars from "./pages/common/Cars";
import CarDetails from "./pages/common/CarDetails";
import Search from "./pages/common/Search";
import About from "./pages/common/About";
import Contact from "./pages/common/Contact";
import Reviews from "./pages/common/Reviews";

// bookings / user pages
import MyBookings from "./pages/user/MyBookings";
import BookingDetail from "./pages/bookings/BookingDetail";
import Overview from "./pages/user/Overview";

// payments
import Checkout from "./components/payments/CheckoutForm";
import Success from "./pages/payments/Success";

// profile page
import Profile from "./pages/user/Profile";

// dashboards / layouts
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtected from "./components/RoleProtected";
import DashboardLayout from "./components/layout/DashboardLayout";

// owner & admin pages
import OwnerBookings from "./pages/owner/OwnerBookings";
import ManageCars from "./pages/owner/ManageCars";
import OwnerKyc from "./pages/owner/KycUpload";
import OwnerEarnings from "./pages/owner/Earnings";
import AddCarPage from "./pages/owner/AddCar";
import EditCarPage from "./pages/owner/EditCar";


// admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOwners from "./pages/admin/Owners";
import AdminCars from "./pages/admin/Cars";
import AdminBookings from "./pages/admin/Bookings";
import OwnerDetails from "./pages/admin/OwnerDetails"; 
import AdminCustomers from "./pages/admin/Customers"; 
import CustomerDetails from "./pages/admin/CustomerDetails"; 


export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto px-3 py-3 sm:px-6 sm:py-4 sm:max-w-6xl">
        <Routes>
          {/* Public / Common */}
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reviews" element={<Reviews />} />

          {/* Auth */}
          <Route path="/signup" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/reset-password" element={<ResetPasswordWithOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes (any authenticated user) Outlet pattern */}
          <Route element={<ProtectedRoute />}>
            {/* Dashboard nested routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="bookings" element={<MyBookings />} />
            </Route>

            {/* Booking detail - protected */}
            <Route path="/bookings/:id" element={<BookingDetail />} />

            {/* Payment checkout (protected) */}
            <Route path="/payments/checkout" element={<Checkout />} />
            {/* Payment success (protected) */}
            <Route path="/payments/success" element={<Success />} />
          </Route>

          {/* Standalone protected profile route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Owner-specific routes  so only 'owner' can access */}
          <Route
            path="/owner/*"
            element={
              <RoleProtected allowed={["owner"]}>
                <DashboardLayout />
              </RoleProtected>
            }
          >
            <Route index element={<OwnerEarnings />} />
            <Route path="cars" element={<ManageCars />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="kyc" element={<OwnerKyc />} />
            <Route path="cars/add" element={<AddCarPage />} />
            <Route path="cars/edit/:id" element={<EditCarPage />} />
            <Route path="earnings" element={<OwnerEarnings />} />
          </Route>

          {/* Admin-specific routes */}
          <Route
            path="/admin/*"
            element={
              <RoleProtected allowed={["admin"]}>
                <DashboardLayout />
              </RoleProtected>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="owners" element={<AdminOwners />} />
            {/* owner detail route(s) */}
            <Route path="owners/:id" element={<OwnerDetails />} />
            <Route path="owners/:id/kyc" element={<OwnerDetails />} />
            <Route path="cars" element={<AdminCars />} />
            <Route path="bookings" element={<AdminBookings />} />

            {/* customers routes for admin */}
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
