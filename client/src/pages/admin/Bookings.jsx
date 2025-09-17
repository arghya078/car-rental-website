
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchAllBookingsForAdmin } from "../../features/admin/adminThunks";
import BookingList from "../../components/bookings/BookingList";

export default function AdminBookings() {
  const dispatch = useDispatch();

  const { adminBookings = [], loading = false, error = null } = useSelector(
    (s) => s.admin || {}
  );

  useEffect(() => {
    dispatch(fetchAllBookingsForAdmin());
  }, [dispatch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => dispatch(fetchAllBookingsForAdmin())}
          className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-6">Loading bookings…</div>
      ) : error ? (
        <div className="p-4 rounded bg-red-50 text-red-700">Error: {String(error)}</div>
      ) : adminBookings?.length ? (
        <BookingList bookings={adminBookings} role="admin" />
      ) : (
        <div className="p-6 text-slate-600">No bookings found.</div>
      )}
    </div>
  );
}
