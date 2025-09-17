
import { createSlice } from "@reduxjs/toolkit";
import { submitKyc } from "./ownerThunks";

const initialState = {
  kycSubmitting: false,
  kycError: null,
  kycMessage: null,
  lastKycResponse: null, 
};

const ownerSlice = createSlice({
  name: "owners",
  initialState,
  reducers: {
    clearError(state) {
      state.kycError = null;
    },
    clearMessage(state) {
      state.kycMessage = null;
    },
    clearLastResponse(state) {
      state.lastKycResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitKyc.pending, (s) => {
        s.kycSubmitting = true;
        s.kycError = null;
        s.kycMessage = null;
      })
      .addCase(submitKyc.fulfilled, (s, action) => {
        s.kycSubmitting = false;
        s.kycMessage = action.payload?.message || "Documents uploaded";
        s.lastKycResponse = action.payload?.user || action.payload || null;
      })
      .addCase(submitKyc.rejected, (s, action) => {
        s.kycSubmitting = false;
        s.kycError =
          action.payload || action.error?.message || "Failed to upload documents";
      });
  },
});

export const { clearError, clearMessage, clearLastResponse } = ownerSlice.actions;
export default ownerSlice.reducer;
