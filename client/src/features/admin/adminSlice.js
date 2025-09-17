
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPendingOwners,
  fetchOwnerKyc,
  fetchOwnerById, 
  approveOwnerThunk,
  rejectOwnerThunk,
  fetchApprovedOwners,
  fetchCustomers,
  fetchCustomerDetails,
  fetchCustomerBookings,
  deleteCustomerThunk,
  makeAdminThunk,
  fetchAllBookingsForAdmin, 
} from "./adminThunks";

const initialState = {
  pendingOwners: [],
  approvedOwners: [],
  ownerKyc: null,
  customers: [],
  customerDetails: null,
  customerBookings: [],
  adminBookings: [],
  loading: false,
  error: null,
  message: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
    clearAdminMessage(state) {
      state.message = null;
    },
    clearOwnerKyc(state) {
      state.ownerKyc = null;
    },
    clearCustomerDetails(state) {
      state.customerDetails = null;
      state.customerBookings = [];
    },
    clearAdminBookings(state) {
      state.adminBookings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch pending owners
      .addCase(fetchPendingOwners.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchPendingOwners.fulfilled, (s, action) => {
        s.loading = false;
        s.pendingOwners = action.payload || [];
      })
      .addCase(fetchPendingOwners.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      // owner kyc 
      .addCase(fetchOwnerKyc.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchOwnerKyc.fulfilled, (s, action) => {
        s.loading = false;
        s.ownerKyc = action.payload?.owner || action.payload || null;
      })
      .addCase(fetchOwnerKyc.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      // owner kyc (by fetchOwnerById )
      .addCase(fetchOwnerById.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchOwnerById.fulfilled, (s, action) => {
        s.loading = false;
        s.ownerKyc = action.payload?.owner || action.payload || null;
      })
      .addCase(fetchOwnerById.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      // approve / reject
      .addCase(approveOwnerThunk.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(approveOwnerThunk.fulfilled, (s, action) => {
        s.loading = false;
        s.message = action.payload?.message || "Owner approved";
        
        s.pendingOwners = s.pendingOwners.filter((o) => String(o._id) !== String(action.payload?.owner?._id));
        
        if (action.payload?.owner) {
          const owner = action.payload.owner;
          // avoid duplicates
          if (!s.approvedOwners.find((o) => String(o._id) === String(owner._id))) {
            s.approvedOwners = [owner, ...s.approvedOwners];
          }
        }
      })
      .addCase(approveOwnerThunk.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      .addCase(rejectOwnerThunk.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(rejectOwnerThunk.fulfilled, (s, action) => {
        s.loading = false;
        s.message = action.payload?.message || "Owner rejected";
        s.pendingOwners = s.pendingOwners.filter((o) => String(o._id) !== String(action.payload?.owner?._id));
      })
      .addCase(rejectOwnerThunk.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      // approved owners
      .addCase(fetchApprovedOwners.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchApprovedOwners.fulfilled, (s, action) => {
        s.loading = false;
        s.approvedOwners = action.payload || [];
      })
      .addCase(fetchApprovedOwners.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      // customers
      .addCase(fetchCustomers.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchCustomers.fulfilled, (s, action) => {
        s.loading = false;
        s.customers = action.payload || [];
      })
      .addCase(fetchCustomers.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      .addCase(fetchCustomerDetails.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchCustomerDetails.fulfilled, (s, action) => {
        s.loading = false;
        s.customerDetails = action.payload || null;
      })
      .addCase(fetchCustomerDetails.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      .addCase(fetchCustomerBookings.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchCustomerBookings.fulfilled, (s, action) => {
        s.loading = false;
        s.customerBookings = action.payload || [];
      })
      .addCase(fetchCustomerBookings.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      // delete customer
      .addCase(deleteCustomerThunk.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(deleteCustomerThunk.fulfilled, (s, action) => {
        s.loading = false;
        s.message = action.payload?.message || "Customer deleted";
        s.customers = s.customers.filter((c) => String(c._id) !== String(action.meta.arg));
      })
      .addCase(deleteCustomerThunk.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      // make admin
      .addCase(makeAdminThunk.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(makeAdminThunk.fulfilled, (s, action) => {
        s.loading = false;
        s.message = action.payload?.message || "User promoted to admin";
      })
      .addCase(makeAdminThunk.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      })

      // fetch all bookings for admin
      .addCase(fetchAllBookingsForAdmin.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchAllBookingsForAdmin.fulfilled, (s, action) => {
        s.loading = false;
        s.adminBookings = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllBookingsForAdmin.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload || action.error.message;
      });
  },
});

export const {
  clearAdminError,
  clearAdminMessage,
  clearOwnerKyc,
  clearCustomerDetails,
  clearAdminBookings,
} = adminSlice.actions;
export default adminSlice.reducer;
