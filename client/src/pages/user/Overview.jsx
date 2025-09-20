import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteUserProfile } from "../../features/users/userThunks";
import { logout } from "../../features/auth/authSlice";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Calendar as CalendarIcon,
  FileText as FileTextIcon,
  Trash2 as TrashIcon,
  Eye as EyeIcon,
  MapPin as MapPinIcon,
} from "lucide-react";

// Helper to resolve a URL
const resolveUrl = (raw) => {
  if (!raw) return null;

  if (typeof raw === "object") {
    const candidate =
      raw?.url ??
      raw?.secure_url ??
      raw?.secureUrl ??
      raw?.fileUrl ??
      raw?.raw?.url ??
      null;
    if (candidate && typeof candidate === "string") {
      raw = candidate;
    } else {
      return null;
    }
  }

  if (typeof raw !== "string") return null;

  if (/^https?:\/\//i.test(raw) || /^blob:/i.test(raw)) return raw;

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const base = API_BASE.replace(/\/$/, "");
  if (raw.startsWith("/")) return base + raw;
  return base + "/" + raw;
};

export default function Overview() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authUser = useSelector((s) => s.auth?.user);
  const usersState = useSelector((s) => s.users || {});
  const profileFromUsers = usersState.profile;
  const loading = usersState.loading;
  const error = usersState.error;
  const message = usersState.message;

  const profile = profileFromUsers || authUser;

  const profilePic = resolveUrl(
    profile?.profilePic?.url ?? profile?.profilePic
  );

  const dlCandidate =
    profile?.documents?.drivingLicense?.url ??
    profile?.documents?.drivingLicense ??
    null;
  const govCandidate =
    profile?.documents?.govId?.url ?? profile?.documents?.govId ?? null;
  const ownershipCandidate =
    profile?.kyc?.ownershipProof?.url ?? profile?.kyc?.ownershipProof ?? null;

  const dlUrl = resolveUrl(dlCandidate);
  const govUrl = resolveUrl(govCandidate);
  const ownershipUrl = resolveUrl(ownershipCandidate);

  const role = profile?.role;

  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Delete your account and uploaded files? This cannot be undone."
      )
    )
      return;

    setDeleting(true);
    try {
      const resultAction = await dispatch(deleteUserProfile());
      if (resultAction?.meta?.requestStatus === "fulfilled") {
        dispatch(logout());
        navigate("/");
      } else {
        console.warn("deleteUserProfile failed", resultAction);
      }
    } catch (e) {
      console.error("deleteUserProfile failed", e);
    } finally {
      setDeleting(false);
    }
  };

  if (!profile && loading) {
    return <div className="p-6 text-center">Loading profile...</div>;
  }

  if (!profile && !loading) {
    return <div className="p-6 text-center">No profile available.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-3xl mx-auto my-8 space-y-6 px-4"
    >
      {/* Top Card - responsive */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="flex-shrink-0 self-center sm:self-start">
          <img
            src={
              profilePic ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile?.name || profile?.email || "User"
              )}&background=6366f1&color=fff&size=256`
            }
            alt={profile?.name || profile?.email || "User"}
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile?.name || profile?.email || "User"
              )}&background=6366f1&color=fff&size=256`;
            }}
          />
        </div>

        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-semibold truncate">
                {profile?.name || "Unnamed"}
              </div>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-1 truncate">
                  <MailIcon size={14} className="text-slate-400" />
                  <span className="truncate max-w-[220px]">{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-1">
                    <PhoneIcon size={14} className="text-slate-400" />
                    <span className="truncate">{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="text-xs text-slate-400">Member since</div>
              {profile?.createdAt ? (
                <div className="text-sm font-medium flex items-center justify-end">
                  <CalendarIcon size={14} className="inline mr-1" />
                  {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              ) : (
                <div className="text-sm">—</div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <UserIcon size={16} className="text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Role</div>
                <div className="font-medium truncate">{profile?.role || "user"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileTextIcon size={16} className="text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Documents</div>
                <div className="font-medium">{dlUrl || govUrl ? "Uploaded" : "None"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPinIcon size={16} className="text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Address</div>
                <div className="font-medium truncate">{profile?.address || "Not provided"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Panel - responsive stacking with horizontal scroll on small screens */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-white p-4 sm:p-6 rounded-xl shadow"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Documents</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Driving license */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
              <FileTextIcon size={14} /> Driving license
            </div>
            {dlUrl ? (
              <div className="space-y-2">
                <a
                  href={dlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded overflow-hidden border"
                >
                  <img
                    src={dlUrl}
                    alt="driving-license"
                    className="w-full sm:w-64 max-h-48 object-contain"
                  />
                </a>
                <div className="flex items-center gap-2">
                  <a
                    className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm"
                    href={dlUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="View driving license"
                  >
                    <EyeIcon size={14} /> View
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Not uploaded</div>
            )}
          </div>

          {/* Government ID */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
              <FileTextIcon size={14} /> Government ID
            </div>
            {govUrl ? (
              <div className="space-y-2">
                <a
                  href={govUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded overflow-hidden border"
                >
                  <img
                    src={govUrl}
                    alt="gov-id"
                    className="w-full sm:w-64 max-h-48 object-contain"
                  />
                </a>
                <div className="flex items-center gap-2">
                  <a
                    className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm"
                    href={govUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="View government id"
                  >
                    <EyeIcon size={14} /> View
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Not uploaded</div>
            )}
          </div>

          {/* Ownership proof (owner only) */}
          {role === "owner" && (
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                <FileTextIcon size={14} /> Ownership proof
              </div>
              {ownershipUrl ? (
                <div className="space-y-2">
                  <a
                    href={ownershipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded overflow-hidden border"
                  >
                    <img
                      src={ownershipUrl}
                      alt="ownership-proof"
                      className="w-full sm:w-64 max-h-48 object-contain"
                    />
                  </a>
                  <div className="flex items-center gap-2">
                    <a
                      className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm"
                      href={ownershipUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="View ownership proof"
                    >
                      <EyeIcon size={14} /> View
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Not uploaded</div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded bg-rose-50 p-3 text-rose-700"
        >
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded bg-emerald-50 p-3 text-emerald-700"
        >
          {message}
        </motion.div>
      )}

      {/* Delete button - full width on mobile */}
      <div className="pt-4 border-t flex justify-end">
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleDelete}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 w-full sm:w-auto justify-center"
          disabled={deleting}
          aria-disabled={deleting}
        >
          <TrashIcon size={16} />
          {deleting ? "Deleting…" : "Delete my account"}
        </motion.button>
      </div>
    </motion.div>
  );
}
