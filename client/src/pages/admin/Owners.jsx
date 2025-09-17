
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {useEffect} from "react";
import {
  fetchPendingOwners,
  fetchApprovedOwners,
} from "../../features/admin/adminThunks";
import { Link, useLocation } from "react-router-dom";

export default function AdminOwners() {
  const dispatch = useDispatch();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialTab = query.get("filter") === "approved" ? "approved" : "pending";

  const [active, setActive] = React.useState(initialTab);

  const { pendingOwners = [], approvedOwners = [], loading, error } = useSelector(
    (s) => s.admin || {}
  );

  useEffect(() => {
    dispatch(fetchPendingOwners());
    dispatch(fetchApprovedOwners());
  }, [dispatch]);

  const fmtDate = (d) => {
    try {
      return d ? new Date(d).toLocaleString() : "—";
    } catch {
      return "—";
    }
  };

  const renderItem = (o, status) => {
    const id = o?._id || o?.id || null;
    const name = o?.name || o?.email || "Unnamed owner";
    const email = o?.email || "—";
    const createdAt = fmtDate(o?.createdAt || o?.created_at || o?.requestedAt);

    return (
      <li key={id || email} className="bg-white p-3 rounded shadow flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{name}</div>
            <div className="text-sm text-slate-500 truncate">{email}</div>
            <div className="text-xs text-slate-400 mt-1">Requested: {createdAt}</div>
          </div>

          <div>
            {status === "pending" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                PENDING
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                APPROVED
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {id ? (
            <Link
              to={status === "pending" ? `/admin/owners/${id}/kyc` : `/admin/owners/${id}`}
              className="px-3 py-1 bg-slate-100 rounded text-sm hover:bg-slate-200"
              aria-label={status === "pending" ? `View KYC for ${name}` : `View owner ${name}`}
            >
              View
            </Link>
          ) : (
            <button
              className="px-3 py-1 bg-gray-200 rounded text-sm text-gray-600 cursor-not-allowed"
              title="Owner id missing"
              aria-disabled="true"
            >
              View
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Owners</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActive("pending"); dispatch(fetchPendingOwners()); }}
            className={`px-3 py-1 rounded ${active === "pending" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
          >
            Pending
          </button>
          <button
            onClick={() => { setActive("approved"); dispatch(fetchApprovedOwners()); }}
            className={`px-3 py-1 rounded ${active === "approved" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
          >
            Approved
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 flex items-center justify-center text-slate-600">Loading owners...</div>
      ) : error ? (
        <div className="p-4 rounded bg-red-50 border border-red-100 text-sm text-red-700">
          Failed to load owners: {String(error)}
        </div>
      ) : (
        <>
          {active === "pending" ? (
            pendingOwners?.length ? (
              <ul className="space-y-2">
                {pendingOwners.map((o) => renderItem(o, "pending"))}
              </ul>
            ) : (
              <div className="p-6 text-slate-500">No pending owners.</div>
            )
          ) : (
            approvedOwners?.length ? (
              <ul className="space-y-2">
                {approvedOwners.map((o) => renderItem(o, "approved"))}
              </ul>
            ) : (
              <div className="p-6 text-slate-500">No approved owners.</div>
            )
          )}
        </>
      )}
    </div>
  );
}
