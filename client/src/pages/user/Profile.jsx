
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import ProfileForm from "../../components/forms/ProfileForm";
import { fetchUserProfile, deleteUserProfile } from "../../features/users/userThunks";
import { clearUserMessage, clearUserError } from "../../features/users/userSlice";
import { logout } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { profile, loading, message } = useSelector((s) => s.users || {});
  const auth = useSelector((s) => s.auth || {});
  const token = auth.token || localStorage.getItem("token");

  const authUserId = auth.user?._id || auth.user?.id || auth.user?.email || null;
  const profileId = profile?._id || profile?.id || profile?.email || null;

  React.useEffect(() => {
    if (!token) return;

    if (profile && profileId && authUserId && profileId === authUserId) return;

    dispatch(fetchUserProfile());
  }, [dispatch, token, authUserId, profileId, profile]);

  React.useEffect(() => {
    return () => {
      dispatch(clearUserMessage());
      dispatch(clearUserError());
    };
  }, [dispatch]);

  React.useEffect(() => {
    if (
      message &&
      typeof message === "string" &&
      message.toLowerCase().includes("deleted")
    ) {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  }, [message, dispatch, navigate]);

  const handleDelete = async () => {
    const ok = window.confirm(
      "Delete your account and uploaded files? This cannot be undone."
    );
    if (!ok) return;
    await dispatch(deleteUserProfile());
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const isOwner = profile?.role && String(profile.role).toLowerCase() === "owner";
  const kycStatus = (profile?.kyc?.status || "not_submitted").toLowerCase();
  const showKycBanner = isOwner && kycStatus !== "approved";

  return (
    <div className="max-w-5xl mx-auto my-10 px-4">
      <div className="bg-gradient-to-r from-white to-indigo-50 p-6 rounded-3xl shadow-lg">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              {profile?.role && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {String(profile.role).toUpperCase()}
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-2">
              Manage your personal details, documents and KYC from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-medium
                bg-red-600 text-white shadow-sm
                hover:bg-red-700 hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
                transition-colors duration-200"
            >
              Sign out
            </button>
          </div>
        </div>

        {showKycBanner && (
          <div className="mt-4 p-4 rounded-lg border border-amber-100 bg-amber-50 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium text-amber-800">
                KYC status: {kycStatus.toUpperCase()}
              </div>
              <div className="text-sm text-amber-700 mt-1">
                Your account is not yet approved. Please add your address and phone number and submit the required and wait untill our team verify that your documents are valid or not. Thankyou for your patience.
                {profile?.kyc?.rejectionReason && (
                  <div className="mt-2 text-sm text-red-700">
                    Reason: {profile.kyc.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/owner/kyc")}
                className="px-4 py-2 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700"
              >
                View / Submit documents
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
          {loading && !profile ? (
            <div className="p-8 flex items-center justify-center text-sm text-gray-600">
              Loading profile...
            </div>
          ) : (
            <>
              <ProfileForm
                hideHeader
                onDelete={handleDelete}
                profile={profile}
                onProfileUpdated={() => dispatch(fetchUserProfile())}
              />

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-2">
                  {/*remove duplicate */}
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  <div className="text-xs text-gray-500">
                    Member since:{" "}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
