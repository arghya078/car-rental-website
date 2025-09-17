
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOwnerPendingBookings,
  fetchOwnerBookingsWithPayments,
  respondToBooking,
} from "../../features/bookings/bookingThunks";
import BookingList from "../../components/bookings/BookingList";

const FILTERS = [
  { key: "requests", label: "Booking Requests" },
  { key: "all", label: "All bookings (payment status)" },
];

export default function OwnerBookings() {
  const dispatch = useDispatch();
  const { ownerPending = [], ownerAll = [], loading, error } = useSelector((s) => s.bookings ?? {});

  const [filter, setFilter] = React.useState("requests");
  const [respondingId, setRespondingId] = React.useState(null);

  React.useEffect(() => {
    if (filter === "requests") {
      dispatch(fetchOwnerPendingBookings());
    } else {
      dispatch(fetchOwnerBookingsWithPayments());
    }
  }, [filter, dispatch]);

  const handleApprove = async (bookingId) => {
    try {
      setRespondingId(bookingId);
      const res = await dispatch(respondToBooking({ bookingId, action: "approve" }));
      if (res.meta.requestStatus === "fulfilled") {
        dispatch(fetchOwnerPendingBookings());
        dispatch(fetchOwnerBookingsWithPayments());
      } else {
        alert(res.payload || res.error?.message || "Action failed");
      }
    } finally {
      setRespondingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    try {
      setRespondingId(bookingId);
      const res = await dispatch(respondToBooking({ bookingId, action: "reject" }));
      if (res.meta.requestStatus === "fulfilled") {
        dispatch(fetchOwnerPendingBookings());
        dispatch(fetchOwnerBookingsWithPayments());
      } else {
        alert(res.payload || res.error?.message || "Action failed");
      }
    } finally {
      setRespondingId(null);
    }
  };

  const list = filter === "requests" ? ownerPending : ownerAll;
  const pendingCount = Array.isArray(ownerPending) ? ownerPending.length : 0;
  const disableSelect = loading || Boolean(respondingId);

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Bookings</h1>
            <p className="text-sm text-slate-500 mt-1">
              {filter === "requests"
                ? "Incoming customer requests — accept or reject."
                : "All bookings with payment status and filters."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="owner-view-select" className="text-xs text-slate-500">
              View
            </label>

            <div className="flex items-center gap-2">
              <select
                id="owner-view-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-md border bg-white text-sm"
                aria-label="Filter bookings"
                disabled={disableSelect}
                title={disableSelect ? "Action in progress — filter disabled" : "Select bookings view"}
                aria-busy={loading}
              >
                {FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>

              {filter === "requests" && (
                <div
                  className={`ml-1 inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold ${
                    pendingCount > 0 ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                  aria-hidden
                >
                  {pendingCount}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-600">Loading...</div>
          ) : error ? (
            <div className="py-4 text-sm text-red-600">{String(error)}</div>
          ) : list.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {filter === "requests" ? "No pending booking requests." : "No bookings found."}
            </div>
          ) : (
            <BookingList
              bookings={list}
              role="owner"
              onApprove={(id) => handleApprove(id)}
              onReject={(id) => handleReject(id)}
              respondingId={respondingId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
