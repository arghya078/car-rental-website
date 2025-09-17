
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect,useCallback } from "react";
import DocumentViewer from "../../components/Kyc/DocumentViewer";
import Modal from "../../components/ui/Modal";
import {
  approveOwnerThunk,
  rejectOwnerThunk,
  fetchOwnerById,
  fetchPendingOwners,
  fetchApprovedOwners,
} from "../../features/admin/adminThunks";

// helper to get a document url
function getDocUrl(owner = {}, keyVariants = []) {
 
  const tryPaths = (obj, path) => {
    if (!obj || !path) return null;
    const parts = Array.isArray(path) ? path : String(path).split(".");
    let cur = obj;
    for (let p of parts) {
      if (cur == null) return null;
      cur = cur[p];
    }
    return cur;
  };

 
  const normalize = (val) => {
    if (!val && val !== "") return null;
    if (typeof val === "object") {
      if (val.url) return val.url;
      if (val.secure_url) return val.secure_url;
      if (val.public_id && val.url) return val.url;
      if (val.data && val.data.url) return val.data.url;
      return null;
    }
    if (typeof val === "string" && val.trim()) return val.trim();
    return null;
  };

  for (const key of keyVariants) {
    if (Array.isArray(key)) {
      for (const k of key) {
        const v = tryPaths(owner, k);
        const url = normalize(v);
        if (url) return url;
      }
    } else {
      const v = tryPaths(owner, key);
      const url = normalize(v);
      if (url) return url;
    }
  }

  // common paths
  const genericCandidates = [
    "kyc.ownershipProof",
    "kyc.ownership_proof",
    "documents.ownershipProof",
    "documents.ownership_proof",
    "kyc.govId",
    "kyc.gov_id",
    "documents.govId",
    "documents.gov_id",
    "documents.drivingLicense",
    "documents.driving_license",
    "kyc.drivingLicense",
    "kyc.driving_license",
  ];
  for (const p of genericCandidates) {
    const v = tryPaths(owner, p);
    const url = normalize(v);
    if (url) return url;
  }

  return null;
}

// modal
const RejectModal = React.memo(function RejectModal({
  isOpen,
  onClose,
  reason,
  onReasonChange,
  onSubmit,
  submitting,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Owner KYC">
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Please provide a clear reason for rejection. This reason will be emailed to the owner.
        </p>
        <textarea
          value={reason}
          onChange={onReasonChange}
          className="w-full border rounded p-2 min-h-[120px]"
          placeholder="Enter rejection reason (required)"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded">
            Cancel
          </button>
          <button onClick={onSubmit} className="px-3 py-2 bg-red-600 text-white rounded" disabled={submitting}>
            {submitting ? "Submitting..." : "Reject & Notify"}
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default function OwnerDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [owner, setOwner] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const adminState = useSelector((s) => s.admin || {});
  const { loading: adminLoading } = adminState;

  useEffect(() => {
    const fetch = async () => {
      setLoadingLocal(true);
      const res = await dispatch(fetchOwnerById(id));
      setLoadingLocal(false);

      if (res?.meta?.requestStatus === "fulfilled") {
        const payload = res.payload ?? {};
        const ownerObj = payload?.owner ?? payload;
        setOwner(ownerObj);
      } else {
        navigate("/admin/owners");
      }
    };
    if (id) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id]);

  // Stable handlers 
  const handleApprove = useCallback(async () => {
    if (!owner) return;
    setLoadingLocal(true);
    const oid = owner._id || owner.id || id;
    const res = await dispatch(approveOwnerThunk(oid));
    setLoadingLocal(false);

    if (res.meta?.requestStatus === "fulfilled") {
      // refresh lists so dashboard and owners lists update
      dispatch(fetchPendingOwners());
      dispatch(fetchApprovedOwners());
      // navigate back to owners
      navigate("/admin/owners");
    } else {
      alert(res.payload || res.error?.message || "Approve failed");
    }
    // Only depend on dispatch/navigate/id/owner references intentionally
  }, [dispatch, navigate, id, owner]);

  const openRejectModal = useCallback(() => {
    setRejectReason("");
    setRejectOpen(true);
  }, []);

  // keep stable onChange handler for textarea (so RejectModal doesn't get a new fn each time)
  const handleReasonChange = useCallback((e) => {
    setRejectReason(e.target.value);
  }, []);

  const submitReject = useCallback(async () => {
    if (!rejectReason || !rejectReason.trim()) {
      return alert("Please enter a rejection reason (required)");
    }
    setSubmittingReject(true);
    const oid = owner?._id || owner?.id || id;
    const res = await dispatch(rejectOwnerThunk({ id: oid, reason: rejectReason.trim() }));
    setSubmittingReject(false);
    setRejectOpen(false);

    if (res.meta?.requestStatus === "fulfilled") {
      dispatch(fetchPendingOwners());
      dispatch(fetchApprovedOwners());
      navigate("/admin/owners");
    } else {
      alert(res.payload || res.error?.message || "Reject failed");
    }
  }, [rejectReason, dispatch, navigate, id, owner]);

  if (loadingLocal || !owner) {
    return <div className="p-6">Loading...</div>;
  }

  const kycStatus = (owner?.kyc?.status || owner?.kycStatus || owner?.kyc_status || "").toString().toLowerCase();
  const isVerifiedFlag = !!(owner?.isVerified || owner?.verified || owner?.is_approved || owner?.isApproved);
  const isApproved = kycStatus === "approved" || isVerifiedFlag || owner?.role === "admin" || owner?.status === "approved";

  // check if owner has id
  const ownerHasId = Boolean(owner?._id || owner?.id);

  // Attempt to extract the three documents using many possible key names
  const ownershipUrl = getDocUrl(owner, [
    ["kyc.ownershipProof", "kyc.ownership_proof", "documents.ownershipProof", "documents.ownership_proof"],
    "ownershipProof",
    "ownership_proof",
  ]);

  const govIdUrl = getDocUrl(owner, [
    ["kyc.govId", "kyc.gov_id", "documents.govId", "documents.gov_id"],
    "govId",
    "gov_id",
  ]);

  const dlUrl = getDocUrl(owner, [
    ["kyc.drivingLicense", "kyc.driving_license", "documents.drivingLicense", "documents.driving_license"],
    "drivingLicense",
    "driving_license",
  ]);

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{owner.name || owner.email || "Owner"}</h2>
          <div className="text-sm text-slate-500">{owner.email}</div>
          <div className="text-xs text-slate-400 mt-1">
            KYC status: {kycStatus || (isApproved ? "approved" : "pending")}
          </div>
        </div>

        <div className="flex gap-2">
          {/* Only show approve/reject when owner is not yet approved and has id */}
          {!isApproved && ownerHasId ? (
            <>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded"
                disabled={adminLoading || loadingLocal}
              >
                Approve
              </button>

              <button
                onClick={openRejectModal}
                className="px-4 py-2 bg-red-600 text-white rounded"
                disabled={adminLoading || loadingLocal}
              >
                Reject
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-2">
              <span className="text-sm px-3 py-1 rounded bg-green-100 text-green-800">Approved</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-slate-600">Ownership proof</div>
          <div className="mt-2">
            {ownershipUrl ? (
              <DocumentViewer url={ownershipUrl} alt="Ownership proof" />
            ) : (
              <div className="text-slate-400 text-sm">Not uploaded</div>
            )}
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-600">Government ID</div>
          <div className="mt-2">
            {govIdUrl ? (
              <DocumentViewer url={govIdUrl} alt="Government ID" />
            ) : (
              <div className="text-slate-400 text-sm">Not uploaded</div>
            )}
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-600">Driving Licence</div>
          <div className="mt-2">
            {dlUrl ? <DocumentViewer url={dlUrl} alt="Driving Licence" /> : <div className="text-slate-400 text-sm">Not uploaded</div>}
          </div>
        </div>
      </div>

      {/* Reject modal */}
      <RejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        reason={rejectReason}
        onReasonChange={handleReasonChange}
        onSubmit={submitReject}
        submitting={submittingReject}
      />
    </div>
  );
}
