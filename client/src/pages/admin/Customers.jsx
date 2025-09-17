// src/pages/admin/Customers.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchCustomers, deleteCustomerThunk } from "../../features/admin/adminThunks";
import { Link } from "react-router-dom";

export default function Customers() {
  const dispatch = useDispatch();
  const { customers = [], loading, error } = useSelector((s) => s.admin || {});

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    const res = await dispatch(deleteCustomerThunk(id));
    if (res.meta?.requestStatus === "fulfilled") {
      dispatch(fetchCustomers());
      alert("Customer deleted");
    } else {
      alert(res.payload || res.error?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Customers</h2>
        <button
          onClick={() => dispatch(fetchCustomers())}
          className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-6">Loading...</div>
      ) : error ? (
        <div className="p-4 rounded bg-red-50 text-red-700">{String(error)}</div>
      ) : customers?.length ? (
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c._id} className="bg-white p-3 rounded shadow flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-slate-500">{c.email}</div>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/customers/${c._id}`} className="px-3 py-1 bg-slate-100 rounded">View</Link>
                <button onClick={() => handleDelete(c._id)} className="px-3 py-1 bg-red-50 text-red-600 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-slate-500 p-6">No customers found.</div>
      )}
    </div>
  );
}
