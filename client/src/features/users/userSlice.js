
import { createSlice } from "@reduxjs/toolkit";
import { fetchUserProfile, updateUserProfile, deleteUserProfile } from "./userThunks";
import { loginThunk } from "../auth/authThunks"; // 

// Helper
const normalizeDocument = (d) => {
  if (!d) return null;

  // string treate as a URL
  if (typeof d === "string") {
    return { url: d, public_id: null, raw: d };
  }

  // If it's an object, try common properties
  const url = d?.url ?? d?.secure_url ?? d?.secureUrl ?? d?.fileUrl ?? null;
  const public_id = d?.public_id ?? d?.id ?? d?.publicId ?? null;

  return {
    url: url || null,
    public_id: public_id || null,
    raw: d,
  };
};

const normalizeUser = (user) => {
  if (!user || typeof user !== "object") return user;

  const copy = { ...user };

  if (copy.documents && typeof copy.documents === "object") {
    const docs = {};
    Object.keys(copy.documents).forEach((k) => {
      try {
        docs[k] = normalizeDocument(copy.documents[k]);
      } catch (e) {
        console.warn("Failed to normalize document:", e.message);
        docs[k] = null;
      }
    });
    copy.documents = docs;
  } else {
    copy.documents = copy.documents || {};
  }

  if (copy.kyc && typeof copy.kyc === "object") {
    const kycCopy = { ...copy.kyc };
    if (kycCopy.ownershipProof) {
      kycCopy.ownershipProof = normalizeDocument(kycCopy.ownershipProof);
    }
    copy.kyc = kycCopy;
  } else {
    copy.kyc = copy.kyc || {};
  }

  if (copy.profilePic) {
    copy.profilePic = normalizeDocument(copy.profilePic);
  } else {
    copy.profilePic = null;
  }

  return copy;
};

const initialStoredProfile = (() => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
})();

const initialState = {
  profile: initialStoredProfile || null,
  loading: false,   
  updating: false,  
  deleting: false,  
  error: null,
  message: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
    clearUserMessage(state) {
      state.message = null;
    },
    clearProfile(state) {
      state.profile = null;
      localStorage.removeItem("user");
    },
    
    setProfile(state, action) {
      const payload = action.payload || null;
      const normalized = payload ? normalizeUser(payload) : null;
      state.profile = normalized;
      if (normalized) {
        try {
          localStorage.setItem("user", JSON.stringify(normalized));
        } catch (e) {
          console.log(e);
          // ignore localStorage errors
        }
      } else {
        localStorage.removeItem("user");
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginThunk.pending, (s) => {
      s.profile = null;
      s.loading = true;
      s.error = null;
    });

    builder
      // fetch
      .addCase(fetchUserProfile.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (s, action) => {
        s.loading = false;
        const payload = action.payload || null;
        const profileRaw = payload?.user ?? payload;
        const profile = profileRaw ? normalizeUser(profileRaw) : null;
        s.profile = profile;
        if (profile) {
          try {
            localStorage.setItem("user", JSON.stringify(profile));
          } catch (e) {
            console.log(e);
            // ignore 
          }
        }
      })
      .addCase(fetchUserProfile.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error?.message || "Failed to fetch profile";
      })

      // update
      .addCase(updateUserProfile.pending, (s) => {
        s.updating = true;
        s.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (s, action) => {
        s.updating = false;
        s.loading = false; 
        const payload = action.payload || null;
        const profileRaw = payload?.user ?? payload;
        if (profileRaw) {
          const profile = normalizeUser(profileRaw);
          s.profile = profile;
          try {
            localStorage.setItem("user", JSON.stringify(profile));
          } catch (e) {
            console.log(e);
          }
        }
        s.message = (payload && payload.message) || "Profile updated";
      })
      .addCase(updateUserProfile.rejected, (s, action) => {
        s.updating = false;
        s.loading = false;
        s.error = action.payload || action.error?.message || "Failed to update profile";
      })

      // delete
      .addCase(deleteUserProfile.pending, (s) => {
        s.deleting = true;
        s.error = null;
      })
      .addCase(deleteUserProfile.fulfilled, (s, action) => {
        s.deleting = false;
        s.loading = false;
        s.profile = null;
        localStorage.removeItem("user");
        s.message = (action.payload && action.payload.message) || "Profile deleted";
      })
      .addCase(deleteUserProfile.rejected, (s, action) => {
        s.deleting = false;
        s.loading = false;
        s.error = action.payload || action.error?.message || "Failed to delete profile";
      });
  },
});

export const { clearUserError, clearUserMessage, clearProfile, setProfile } = userSlice.actions;
export default userSlice.reducer;
