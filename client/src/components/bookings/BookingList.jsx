
import React, { useMemo } from "react";
import BookingCard from "./BookingCard";
import { ClipboardList } from "lucide-react";

function noop() {}

function BookingListInner({
  bookings = [],
  role = "customer",
  isPaying = false, 
  payingId = null, 
  respondingId = null, 
  onCancel,
  onPay,
  onApprove,
  onReject,
}) {
  const safeBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.filter(Boolean);
  }, [bookings]);

  if (safeBookings.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="mx-auto max-w-md text-center p-6 rounded-lg bg-white shadow-sm border">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No bookings found</h3>
          <p className="text-sm text-slate-500 mt-2">There are no bookings for this view right now.</p>
        </div>
      </div>
    );
  }

  // only owners can approve or reject
  const approveHandler = role === "owner" ? onApprove : noop;
  const rejectHandler = role === "owner" ? onReject : noop;

  return (
    <div
      role="list"
      aria-label={role === "owner" ? "Owner bookings list" : "Bookings list"}
      className="w-full max-w-6xl mx-auto space-y-4"
    >
      {safeBookings.map((b, idx) => {
        const key = b?._id ?? b?.id ?? b?.bookingId ?? `booking-${idx}`;
        return (
          <div role="listitem" key={key}>
            <BookingCard
              booking={b}
              role={role}
              isPaying={isPaying}
              payingId={payingId}
              respondingId={respondingId}
              onCancel={onCancel}
              onPay={onPay}
              onApprove={approveHandler}
              onReject={rejectHandler}
            />
          </div>
        );
      })}
    </div>
  );
}

const BookingList = React.memo(BookingListInner);
export default BookingList;
