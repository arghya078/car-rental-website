
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import DocumentViewer from "../../components/Kyc/DocumentViewer";
import Modal from "../../components/ui/Modal";
import { submitKyc } from "../../features/owners/ownerThunks";
import { clearMessage, clearError } from "../../features/owners/ownerSlice";
import { getProfile } from "../../features/users/userThunks";
import { UploadCloud, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function OwnerKyc() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const ownerState = useSelector((s) => s.owners || {});
  const { kycSubmitting, kycMessage, kycError } = ownerState;

  const [govFile, setGovFile] = useState(null);
  const [dlFile, setDlFile] = useState(null);
  const [ownershipFile, setOwnershipFile] = useState(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerTitle, setViewerTitle] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  useEffect(() => {
    if (kycMessage) {
      setShowSuccessModal(true);
      setTimeout(() => dispatch(clearMessage()), 700);
    }
    return () => {
      dispatch(clearError());
    };
  }, [kycMessage, dispatch]);

  const getRemote = (keys) => {
    for (const k of keys) {
      const v = k
        .split(".")
        .reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : null), user);
      if (v) return typeof v === "string" ? v : v?.url ?? null;
    }
    return null;
  };

  const remoteOwnership = getRemote(["kyc.ownershipProof", "documents.ownershipProof"]);
  const remoteGov = getRemote(["documents.govId", "kyc.govId"]);
  const remoteDl = getRemote(["documents.drivingLicense", "kyc.drivingLicense"]);

  const hasAnyRemoteDoc = Boolean(remoteOwnership || remoteGov || remoteDl);
  const hasAnyLocalFile = Boolean(ownershipFile || govFile || dlFile);
  const noDocsAtAll = !hasAnyRemoteDoc && !hasAnyLocalFile;

  // normalize and compute status
  const rawStatus = (user?.kyc?.status || "").toLowerCase();
  const kycStatus = (noDocsAtAll ? "not_submitted" : rawStatus || "not_submitted").toLowerCase();

  // compute state
  const isPending = rawStatus === "pending" && hasAnyRemoteDoc;
  const isRejected = kycStatus === "rejected";
  const isApproved = kycStatus === "approved";

  const validFile = (f) => {
    if (!f) return false;
    const allowed = ["image/jpeg", "image/png", "application/pdf", "image/jpg", "image/webp", "image/heic"];
    return allowed.includes(f.type);
  };

  const ownershipValid = ownershipFile ? validFile(ownershipFile) : Boolean(remoteOwnership);
  const govValid = govFile ? validFile(govFile) : Boolean(remoteGov);
  const dlValid = dlFile ? validFile(dlFile) : Boolean(remoteDl);

  const allThreePresent = (ownershipFile || remoteOwnership) && (govFile || remoteGov) && (dlFile || remoteDl);
  const allValid = ownershipValid && govValid && dlValid;

  const canSubmit = React.useMemo(() => {
    if (isApproved) return false;

    // allow initial submit if all three present & valid
    if (allThreePresent && allValid) return true;

    // if rejected, allow re-upload of any corrected doc
    if (isRejected) {
      return (ownershipFile && ownershipValid) || (govFile && govValid) || (dlFile && dlValid);
    }
    return false;
  }, [isApproved, isRejected, allThreePresent, allValid, ownershipFile, govFile, dlFile, ownershipValid, govValid, dlValid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmittingLocal) return;

    setIsSubmittingLocal(true);
    try {
      const fd = new FormData();
      if (govFile) fd.append("govId", govFile);
      if (dlFile) fd.append("drivingLicense", dlFile);
      if (ownershipFile) fd.append("ownershipProof", ownershipFile);

      const res = await dispatch(submitKyc(fd));
      if (res.meta?.requestStatus === "fulfilled") {
        await dispatch(getProfile());

        // clear local files
        setGovFile(null);
        setDlFile(null);
        setOwnershipFile(null);

        // show the simple pending modal
        setShowSuccessModal(true);
      } else {
        alert(res.payload || res.error?.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const openViewer = (url, title = "Document") => {
    setViewerUrl(url);
    setViewerTitle(title);
    setViewerOpen(true);
  };
  const closeViewer = () => {
    setViewerOpen(false);
    setViewerUrl(null);
    setViewerTitle("");
  };

  const getName = (fileOrUrl) => {
    if (!fileOrUrl) return "-";
    if (typeof fileOrUrl === "string") {
      try {
        return decodeURIComponent(new URL(fileOrUrl).pathname.split("/").pop()) || fileOrUrl;
      } catch {
        return fileOrUrl;
      }
    }
    return fileOrUrl.name || "uploaded-file";
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.02 },
  };

  const StatusBadge = ({ valid }) => (
    <div
      className="text-xs text-slate-400 max-w-[8rem] truncate text-right"
      title={valid ? "Valid" : "Invalid / missing"}
    >
      {valid ? "Valid" : "Invalid / missing"}
    </div>
  );

  // controls disabled only while submitting, or when KYC is under review or when approved
  const controlsDisabled = isSubmittingLocal || kycSubmitting || isPending || isApproved;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Owner KYC</h2>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm text-slate-600">KYC status:</div>
          <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
            {kycStatus ? kycStatus.toUpperCase() : "NOT SUBMITTED"}
          </div>
        </div>

        <div className="text-sm text-slate-500">
          {isPending && "Documents are under review. You cannot change documents while review is in progress."}
          {isRejected && user?.kyc?.rejectionReason && "KYC rejected — see reason below and resubmit any corrected documents."}
          {isApproved && "Account verified. Gov ID & Driving Licence can be updated from Profile later."}
        </div>
      </div>

      {!isApproved && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
              label: "Ownership proof",
              file: ownershipFile,
              remote: remoteOwnership,
              setFile: setOwnershipFile,
              valid: ownershipValid
            }, {
              label: "Government ID",
              file: govFile,
              remote: remoteGov,
              setFile: setGovFile,
              valid: govValid
            }, {
              label: "Driving Licence",
              file: dlFile,
              remote: remoteDl,
              setFile: setDlFile,
              valid: dlValid
            }].map((doc, idx) => {
              // preview URL (file -> object URL, otherwise remote url)
              const previewUrl = doc.file ? URL.createObjectURL(doc.file) : doc.remote;
              const canOpen = Boolean(previewUrl);

              return (
                <motion.div
                  key={idx}
                  variants={cardVariant}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="border rounded-lg p-3 flex flex-col items-stretch"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-600">{doc.label}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[14rem]" title={getName(doc.file ? doc.file : doc.remote)}>
                        {getName(doc.file ? doc.file : doc.remote)}
                      </div>
                    </div>
                    <label
                      htmlFor={`fileInput-${idx}`}
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded text-sm font-medium cursor-pointer ${
                        controlsDisabled ? "bg-gray-100 text-slate-400 cursor-not-allowed" : "bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <input
                        id={`fileInput-${idx}`}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (controlsDisabled) return;
                          const f = e.target.files?.[0] ?? null;
                          doc.setFile(f);
                        }}
                        disabled={controlsDisabled}
                      />
                      <span className="sr-only">Upload {doc.label}</span>
                    </label>
                  </div>

                  <div className="mt-3 flex-1">
                    <div className="border rounded bg-gray-50 p-2 flex items-center justify-center min-h-[120px]">
                      <DocumentViewer
                        url={previewUrl}
                        alt={doc.label}
                        imgClass="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => canOpen && openViewer(previewUrl, doc.label)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-slate-700 hover:bg-gray-50"
                      disabled={!canOpen}
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <StatusBadge valid={doc.valid} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-500">Upload format: JPG, PNG, PDF. Max file size enforced by backend.</div>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white ${
                isSubmittingLocal || kycSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : canSubmit
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              disabled={!canSubmit || isSubmittingLocal || kycSubmitting || controlsDisabled}
            >
              {isSubmittingLocal || kycSubmitting ? "Processing..." : "Submit"}
            </button>
          </div>

          {kycError && <div className="text-sm text-red-600">{kycError}</div>}
        </form>
      )}

      <Modal isOpen={viewerOpen} onClose={closeViewer} title={viewerTitle}>
        <div className="max-w-3xl mx-auto">
          <div className="w-full h-[60vh]">
            <DocumentViewer url={viewerUrl} alt={viewerTitle} imgClass="w-full h-full object-contain" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Documents under verification">
        <div className="space-y-3">
          <p>Your documents are under verification.</p>
          <p className="text-sm text-slate-500">While pending, you cannot add cars, manage cars, or view bookings/earnings.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowSuccessModal(false)} className="px-3 py-2 border rounded">OK</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
