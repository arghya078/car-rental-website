// src/pages/admin/CustomerDetails.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {useState, useEffect} from "react";
import DocumentViewer from "../../components/Kyc/DocumentViewer";
import BookingList from "../../components/bookings/BookingList";
import { fetchCustomerDetails, fetchCustomerBookings, deleteCustomerThunk } from "../../features/admin/adminThunks";

function collectDocumentUrls(customer = {}) {
  const results = [];

  const tryGet = (obj, path) => {
    if (!obj) return null;
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return null;
      cur = cur[p];
    }
    return cur;
  };

  const normalize = (val) => {
    if (!val && val !== "") return null;
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      if (val.url) return val.url;
      if (val.secure_url) return val.secure_url;
      if (val.data && val.data.url) return val.data.url;
      return null;
    }
    return null;
  };

  const namedPaths = {
    "Profile Photo": ["profilePic", "profile_picture", "documents.profilePic", "documents.profile_picture", "kyc.profilePic"],
    "Government ID": ["documents.govId", "documents.gov_id", "kyc.govId", "kyc.gov_id", "govId"],
    "Driving License": ["documents.drivingLicense", "documents.driving_license", "kyc.drivingLicense", "kyc.driving_license", "drivingLicense"],
    "Address Proof": ["documents.addressProof", "documents.address_proof", "kyc.addressProof", "kyc.address_proof"],
  };


  for (const [label, paths] of Object.entries(namedPaths)) {
    for (const path of paths) {
      const val = tryGet(customer, path);
      const url = normalize(val);
      if (url) {
        results.push({ label, url });
        break; 
      }
    }
  }

  const docsObj = customer?.documents || customer?.kyc?.documents || null;
  if (docsObj && typeof docsObj === "object") {
    for (const [k, v] of Object.entries(docsObj)) {
      const url = normalize(v);
      if (url) {
        if (!results.some((r) => r.url === url)) {
          const label = k
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim();
          results.push({ label, url });
        }
      }
    }
  }

  return results;
}

export default function CustomerDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerDetails, customerBookings = [], loading } = useSelector((s) => s.admin || {});


  const [showBookings, setShowBookings] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerDetails(id));
    }
  }, [dispatch, id]);

  const loadBookings = async () => {
    if (!id) return;
    setShowBookings(true);
    await dispatch(fetchCustomerBookings(id));
    // the bookings appear in admin.customerBookings (from slice)
  };

  const closeBookings = () => {
    setShowBookings(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    const res = await dispatch(deleteCustomerThunk(id));
    if (res.meta?.requestStatus === "fulfilled") {
      alert("Customer deleted");
      navigate("/admin/customers");
    } else {
      alert(res.payload || res.error?.message || "Delete failed");
    }
  };

  if (loading && !customerDetails) {
    return <div>Loading...</div>;
  }

  if (!customerDetails) {
    return <div>Customer not found</div>;
  }

  const docList = collectDocumentUrls(customerDetails);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Customer Details</h2>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="px-3 py-1 bg-red-50 text-red-600 rounded">
            Delete
          </button>

          <button onClick={() => navigate("/admin/customers")} className="px-3 py-1 bg-slate-100 rounded">
            Back
          </button>

          {/* NEW: See Bookings button */}
          <button
            onClick={loadBookings}
            className="px-3 py-1 bg-indigo-600 text-white rounded"
            aria-expanded={showBookings}
          >
            See Bookings
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow space-y-4">
        <div>
          <div className="text-lg font-semibold">{customerDetails.name || "—"}</div>
          <div className="text-sm text-slate-500">{customerDetails.email || "—"}</div>
          {customerDetails.phone && <div className="text-sm text-slate-500">Phone: {customerDetails.phone}</div>}
          {customerDetails.address && (
            <div className="text-sm text-slate-500 mt-1">
              Address: {typeof customerDetails.address === "string" ? customerDetails.address : (
                <>
                  {customerDetails.address.line1 ? <div>{customerDetails.address.line1}</div> : null}
                  {customerDetails.address.city ? <div>{customerDetails.address.city}, {customerDetails.address.state}</div> : null}
                  {customerDetails.address.postalCode ? <div>{customerDetails.address.postalCode}</div> : null}
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-medium mb-2">Uploaded Documents</h4>

          {docList.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docList.map((d, idx) => (
                <div key={idx} className="p-3 border rounded">
                  <div className="text-sm text-slate-600 mb-2">{d.label}</div>
                  <DocumentViewer url={d.url} alt={`${d.label}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500">No documents uploaded.</div>
          )}
        </div>
      </div>

      {/* Bookings panel  */}
      {showBookings && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Bookings for {customerDetails.name || customerDetails.email}</h3>
            <div className="flex gap-2">
              <button onClick={closeBookings} className="px-3 py-1 bg-slate-100 rounded">Close</button>
              <button onClick={() => dispatch(fetchCustomerBookings(id))} className="px-3 py-1 bg-indigo-600 text-white rounded">Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="p-4">Loading bookings…</div>
          ) : Array.isArray(customerBookings) && customerBookings.length ? (
            <BookingList bookings={customerBookings} role="admin" />
          ) : (
            <div className="text-slate-600 p-3">No bookings for this customer.</div>
          )}
        </div>
      )}
    </div>
  );
}
