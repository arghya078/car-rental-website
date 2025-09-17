
import { createAsyncThunk } from "@reduxjs/toolkit";
import adminApi from "../../api/adminApi";

// helper 
const getToken = (getState) =>
  getState?.auth?.token || localStorage.getItem("token") || null;

export const fetchPendingOwners = createAsyncThunk(
  "admin/fetchPendingOwners",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.getPendingOwners(token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchOwnerKyc = createAsyncThunk(
  "admin/fetchOwnerKyc",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.getOwnerKycById(id, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchOwnerById = createAsyncThunk(
  "admin/fetchOwnerById",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.getOwnerKycById(id, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const approveOwnerThunk = createAsyncThunk(
  "admin/approveOwner",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.approveOwner(id, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const rejectOwnerThunk = createAsyncThunk(
  "admin/rejectOwner",
  async ({ id, reason }, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.rejectOwner(id, { reason }, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchApprovedOwners = createAsyncThunk(
  "admin/fetchApprovedOwners",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.getApprovedOwners(token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchCustomers = createAsyncThunk(
  "admin/fetchCustomers",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.getAllCustomers(token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchCustomerDetails = createAsyncThunk(
  "admin/fetchCustomerDetails",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.getCustomerDetails(id, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchCustomerBookings = createAsyncThunk(
  "admin/fetchCustomerBookings",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.getCustomerBookings(id, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteCustomerThunk = createAsyncThunk(
  "admin/deleteCustomer",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.deleteCustomer(id, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const makeAdminThunk = createAsyncThunk(
  "admin/makeAdmin",
  async (userId, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const { data } = await adminApi.makeAdmin(userId, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAllBookingsForAdmin = createAsyncThunk(
  "admin/fetchAllBookingsForAdmin",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const res = await adminApi.getAllBookings(token);
      const data = res?.data ?? res;

      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.bookings)) return data.bookings;
      if (Array.isArray(data?.data?.bookings)) return data.data.bookings;
      return []; 
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.response?.data || err?.message || "Failed to fetch admin bookings";
      return rejectWithValue(message);
    }
  }
);
