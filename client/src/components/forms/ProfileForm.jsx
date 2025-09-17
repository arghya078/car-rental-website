
import React from "react";
import { useForm } from "react-hook-form";
import Button from "../ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { updateUserProfile } from "../../features/users/userThunks";
import DocumentViewer from "../Kyc/DocumentViewer";


export default function ProfileForm({
  profile: propProfile = null,
  onDelete,
  hideHeader = false,
  onProfileUpdated,
}) {
  const dispatch = useDispatch();

  const usersState = useSelector((s) => s.users || {});
  const { error: serverError, message: serverMessage } = usersState;

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { name: "", email: "", address: "", phone: "" },
  });

  useEffect(() => {
    if (!propProfile) return;
    setValue("name", propProfile.name || "");
    setValue("email", propProfile.email || "");
    setValue("address", propProfile.address || "");
    setValue("phone", propProfile.phone || "");
  }, [propProfile, setValue]);

  // local file 
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null);

  const [dlFile, setDlFile] = useState(null);
  const [govFile, setGovFile] = useState(null);
  const [ownershipFile, setOwnershipFile] = useState(null);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [picSubmitting, setPicSubmitting] = useState(false);
  const [localMsg, setLocalMsg] = useState(null);

  useEffect(() => {
    if (!profileFile) return setProfilePreviewUrl(null);
    const url = URL.createObjectURL(profileFile);
    setProfilePreviewUrl(url);
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error(e);
        // ignore
      }
    };
  }, [profileFile]);

  
  const profileObj = propProfile || {};
  const docUrlFromDocuments = (key) =>
    profileObj?.documents?.[key]?.url || profileObj?.documents?.[key] || null;
  const docUrlFromKyc = (key) =>
    profileObj?.kyc?.[key]?.url || profileObj?.kyc?.[key] || null;
  const profilePicUrl =
    profileObj?.profilePic?.url || profileObj?.profilePic || null;

  const isOwner =
    !!profileObj &&
    typeof profileObj.role === "string" &&
    profileObj.role.toLowerCase() === "owner";

  const kycStatus = (profileObj?.kyc?.status || "not_submitted").toLowerCase();
  const isPending = kycStatus === "pending";
  const isRejected = kycStatus === "rejected";
  const isApproved = kycStatus === "approved";
  const isNotSubmitted = kycStatus === "not_submitted";

  
  const ownershipEditable = isRejected || isNotSubmitted;
  const govEditable = isRejected || isNotSubmitted || isApproved;
  const dlEditable = isRejected || isNotSubmitted || isApproved;

 
  const docItems = isOwner
    ? [
        {
          key: "drivingLicense",
          title: "Driving License",
          file: dlFile,
          onPick: (e) => setDlFile(e.target.files?.[0] || null),
          onRemove: () => setDlFile(null),
          viewer: docUrlFromDocuments("drivingLicense"),
          editable: !isPending && dlEditable,
        },
        {
          key: "govId",
          title: "Government ID",
          file: govFile,
          onPick: (e) => setGovFile(e.target.files?.[0] || null),
          onRemove: () => setGovFile(null),
          viewer: docUrlFromDocuments("govId"),
          editable: !isPending && govEditable,
        },
        {
          key: "ownershipProof",
          title: "Ownership Proof",
          file: ownershipFile,
          onPick: (e) => setOwnershipFile(e.target.files?.[0] || null),
          onRemove: () => setOwnershipFile(null),
          viewer:
            docUrlFromKyc("ownershipProof") ||
            docUrlFromDocuments("ownershipProof"),
          editable: !isPending && ownershipEditable,
        },
      ]
    : [
        {
          key: "drivingLicense",
          title: "Driving License",
          file: dlFile,
          onPick: (e) => setDlFile(e.target.files?.[0] || null),
          onRemove: () => setDlFile(null),
          viewer: docUrlFromDocuments("drivingLicense"),
          editable: true,
        },
        {
          key: "govId",
          title: "Government ID",
          file: govFile,
          onPick: (e) => setGovFile(e.target.files?.[0] || null),
          onRemove: () => setGovFile(null),
          viewer: docUrlFromDocuments("govId"),
          editable: true,
        },
      ];

  // profile picture 
  const handleProfilePicUpload = async () => {
    if (!profileFile) {
      setLocalMsg("Please select a profile picture first.");
      return;
    }

    setPicSubmitting(true);
    setLocalMsg(null);

    try {
      const fd = new FormData();
      fd.append("profilePic", profileFile);

      const resultAction = await dispatch(updateUserProfile(fd));
      if (updateUserProfile.fulfilled.match(resultAction)) {
        setLocalMsg("Profile picture updated");
        setProfileFile(null);
        setProfilePreviewUrl(null);
        if (onProfileUpdated) onProfileUpdated();
      } else {
        const err =
          resultAction.payload ||
          resultAction.error?.message ||
          "Failed to upload profile picture";
        setLocalMsg(err);
      }
    } catch (e) {
      console.error("profile pic upload error", e);
      setLocalMsg("Failed to upload profile picture");
    } finally {
      setPicSubmitting(false);
    }
  };

  const onSubmit = async (data) => {
    if (formSubmitting) return;
    setLocalMsg(null);
    setFormSubmitting(true);

    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.address) formData.append("address", data.address);
    if (data.phone) formData.append("phone", data.phone);

    // attach docs 
    if (dlFile) formData.append("drivingLicense", dlFile);
    if (govFile) formData.append("govId", govFile);
    if (ownershipFile) formData.append("ownershipProof", ownershipFile);

    try {
      const resultAction = await dispatch(updateUserProfile(formData));
      if (updateUserProfile.fulfilled.match(resultAction)) {
        setLocalMsg("Profile updated successfully.");
        setDlFile(null);
        setGovFile(null);
        setOwnershipFile(null);
        if (onProfileUpdated) onProfileUpdated();
      } else {
        const err =
          resultAction.payload ||
          resultAction.error?.message ||
          "Update failed";
        setLocalMsg(err);
      }
    } catch (e) {
      console.error("profile update error", e);
      setLocalMsg("Failed to update profile");
    } finally {
      setFormSubmitting(false);
    }
  };

 
  const UploadBox = ({ item }) => {
    const [viewerOpen, setViewerOpen] = React.useState(false);

    return (
      <div className="bg-white rounded-lg p-4 border shadow-sm flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-slate-800">
              {item.title}
            </div>
            <div className="text-xs text-gray-400">Accepted: image / pdf</div>
          </div>
          <div
            className={`text-xs font-medium ${
              item.file || item.viewer ? "text-green-600" : "text-gray-400"
            }`}
          >
            {item.file ? "Selected" : item.viewer ? "On file" : "None"}
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center gap-3">
          <div className="w-44 h-28 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center border border-dashed border-gray-200">
            <DocumentViewer
              url={item.viewer}
              alt={item.title}
              imgClass="w-full h-full object-cover rounded"
              showView={false}
            />
          </div>

          <div className="w-full flex flex-col items-center gap-2">
            {item.viewer && (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="px-3 py-1 text-sm border rounded bg-white hover:bg-gray-50"
              >
                View
              </button>
            )}

            <label
              htmlFor={`${item.key}-picker`}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium ${
                item.editable
                  ? "bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <input
                id={`${item.key}-picker`}
                type="file"
                accept="image/*,application/pdf"
                onChange={item.onPick}
                className="hidden"
                disabled={!item.editable}
              />
              <span>{item.file ? "Change file" : "Upload file"}</span>
            </label>

            <div className="flex items-center gap-2 mt-1">
              <div className="text-sm truncate max-w-xs text-slate-700">
                {item.file
                  ? item.file.name
                  : item.viewer
                  ? "On file"
                  : "No file selected"}
              </div>
              {item.file && (
                <button
                  type="button"
                  onClick={item.onRemove}
                  className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {viewerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white rounded shadow max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center p-3 border-b">
                  <div className="font-medium">{item.title}</div>
                  <button
                    className="px-3 py-1 text-sm"
                    onClick={() => setViewerOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="p-4 flex items-center justify-center">
                  <DocumentViewer
                    url={item.viewer}
                    alt={item.title}
                    imgClass="max-w-full max-h-[80vh] object-contain"
                    showView={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const gridColsClass =
    docItems.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  const displayMessage = serverError || serverMessage || localMsg;
  const messageClass = serverError ? "text-red-600" : "text-green-700";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-6 rounded-2xl shadow-lg space-y-6 max-w-5xl mx-auto"
    >
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Edit Profile</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              Last updated:{" "}
              {profileObj?.updatedAt
                ? new Date(profileObj.updatedAt).toLocaleString()
                : "—"}
            </span>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="ml-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 flex flex-col items-center bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 shadow-sm">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-white border border-gray-200 shadow flex items-center justify-center">
            {profilePreviewUrl ? (
              <img
                src={profilePreviewUrl}
                alt="new-profile"
                className="w-full h-full object-cover"
              />
            ) : profilePicUrl ? (
              <img
                src={
                  typeof profilePicUrl === "string"
                    ? profilePicUrl
                    : profilePicUrl?.url
                }
                alt="profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-sm text-slate-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mb-1 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1"
                  />
                </svg>
                <div>No photo</div>
              </div>
            )}
          </div>

          <label className="mt-3 text-sm font-medium">Profile picture</label>
          <div className="mt-3 flex flex-col gap-3 w-full">
            <label
              htmlFor="profilePicInput"
              className={`text-center px-4 py-2 rounded text-sm font-medium transition ${
                picSubmitting
                  ? "bg-indigo-300 text-white cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <input
                id="profilePicInput"
                type="file"
                accept="image/*"
                onChange={(e) => setProfileFile(e.target.files[0] || null)}
                className="hidden"
              />
              {profileFile ? "Change" : "Choose"}
            </label>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleProfilePicUpload}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  picSubmitting
                    ? "bg-indigo-300 text-white"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
                disabled={picSubmitting}
              >
                {picSubmitting ? "Updating..." : "Upload"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileFile(null);
                  if (profilePreviewUrl) {
                    try {
                      URL.revokeObjectURL(profilePreviewUrl);
                    } catch {
                      // ignore
                    }
                    setProfilePreviewUrl(null);
                  }
                  setLocalMsg(null);
                }}
                className="px-6 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700"
                disabled={picSubmitting}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4 bg-white rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                {...register("name")}
                className="w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Email (read-only)
              </label>
              <input
                {...register("email")}
                className="w-full border rounded p-3 bg-gray-50"
                readOnly
                aria-readonly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                {...register("address")}
                className="w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                {...register("phone")}
                className="w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
        {docItems.map((it) => (
          <div key={it.key} className="h-full">
            <UploadBox item={it} />
          </div>
        ))}
      </div>

      {/* single combined message */}
      {displayMessage && (
        <div className={`text-sm ${messageClass}`}>{displayMessage}</div>
      )}

      <div className="w-full flex flex-wrap items-center gap-3">
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={formSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {formSubmitting ? "Updating..." : "Update Profile"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setDlFile(null);
              setGovFile(null);
              setOwnershipFile(null);
              setLocalMsg(null);
            }}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            disabled={formSubmitting || picSubmitting}
          >
            Reset
          </button>
        </div>

        <div className="ml-auto text-xs text-gray-500">
          {profileObj?._id ? `Profile ID: ${profileObj._id}` : "Profile ID: —"}
        </div>
      </div>
    </form>
  );
}
