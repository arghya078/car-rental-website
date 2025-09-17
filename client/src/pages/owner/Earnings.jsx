
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOwnerEarnings } from "../../features/payments/paymentThunks";
import { motion } from "framer-motion";
import { DollarSign, CreditCard, Clock } from "lucide-react";

export default function Earnings() {
  const dispatch = useDispatch();
  const { earnings = { totalEarnings: 0, payments: [] }, earningsLoading, earningsError } =
    useSelector((s) => s.payments ?? {});
  const { bookings = [] } = useSelector((s) => s.bookings ?? {});
  const { user } = useSelector((s) => s.auth ?? {});

  React.useEffect(() => {
    dispatch(fetchOwnerEarnings());
  }, [dispatch]);

  const payments = React.useMemo(
    () => (Array.isArray(earnings?.payments) ? earnings.payments.filter(Boolean) : []),
    [earnings?.payments]
  );

  const fakePaymentsFromBookings = React.useMemo(() => {
    if (!Array.isArray(bookings) || !user?._id) return [];
    return bookings
      .filter(
        (b) =>
          b &&
          String(b.owner) === String(user._id) &&
          (b.paymentStatus === "Succeeded" || b.orderId)
      )
      .map((b) => ({
        _id: `fake-${b._id}`,
        booking: b._id,
        amount: b.totalPrice,
        currency: "USD",
        status: "paid",
        createdAt: b.updatedAt || b.startDate,
        _isFake: true,
      }));
  }, [bookings, user?._id]);

  const allPayments = React.useMemo(() => {
    const ids = new Set();
    const merged = [];
    [...payments, ...fakePaymentsFromBookings].forEach((p) => {
      const key = p._id || p.id || `${p.booking}-${p.createdAt}`;
      if (!ids.has(key)) {
        ids.add(key);
        merged.push(p);
      }
    });
    return merged;
  }, [payments, fakePaymentsFromBookings]);

  // compute total
  const totalFromPayments = React.useMemo(() => {
    return allPayments.reduce((acc, p) => {
      const n = Number(p.amount ?? 0);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [allPayments]);

  const displayedTotal = totalFromPayments;
  const currency = "USD";

  const amountFormatter = React.useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  }, []);

  const formatDateSafe = React.useCallback((value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      if (!d || Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString();
    } catch {
      return String(value);
    }
  }, []);

  const sortedPayments = React.useMemo(() => {
    return [...allPayments].sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [allPayments]);

  return (
    <div className="space-y-8">
      {/* Centered medium-large earnings card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-indigo-50 rounded-full">
            <DollarSign className="text-indigo-600" size={38} />
          </div>
        </div>

        <div className="text-sm uppercase tracking-wide text-slate-500">Total Earnings</div>
        <div className="mt-3 text-4xl font-extrabold text-indigo-700">
          {amountFormatter.format(Number(displayedTotal || 0))}
        </div>
        <div className="mt-2 text-xs text-slate-400">Displayed in USD (provisional until backend confirms)</div>
      </motion.div>

      {/* Transactions / payments list */}
      {earningsLoading ? (
        <div className="rounded bg-white p-6 text-center">Loading earnings…</div>
      ) : earningsError ? (
        <div className="rounded bg-red-50 p-4 text-red-700">{earningsError}</div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="max-w-4xl mx-auto bg-white p-4 rounded-lg shadow space-y-3"
        >
          <h3 className="text-sm font-medium text-slate-700 mb-2">Recent transactions</h3>

          {sortedPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CreditCard size={42} className="mx-auto mb-4" />
              <div className="text-sm">No payments found yet.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedPayments.map((p, idx) => {
                const key = p._id || p.id || `${p.booking}-${idx}`;
                const isFake = Boolean(p._isFake || String(key).startsWith("fake-"));
                const statusLabel = (p.status || p.paymentStatus || "").toString();

                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="flex items-center justify-between p-3 border rounded-md hover:shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-50 rounded text-indigo-600">
                        <DollarSign size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium truncate">
                            {amountFormatter.format(Number(p.amount || 0))}
                          </div>

                          {isFake ? (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              Provisional
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Settled
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 truncate">Booking: {p.booking ?? "-"}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Clock size={12} /> {formatDateSafe(p.createdAt ?? p.updatedAt ?? p.date)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold">{statusLabel || (isFake ? "paid" : "-")}</div>
                      <div className="text-xs text-slate-400">{p.currency ? p.currency.toUpperCase() : currency}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
