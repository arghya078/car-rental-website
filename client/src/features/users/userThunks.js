
import { createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../api/userApi";

// Helper
const readToken = (getState) => getState?.auth?.token || localStorage.getItem("token") || null;

export const fetchUserProfile = createAsyncThunk(
  "users/fetchProfile",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = readToken(getState);
      if (!token) return rejectWithValue("Not authenticated");

      const data = await userApi.getProfile();
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to fetch profile");
    }
  }
);

export const getProfile = fetchUserProfile;

export const updateUserProfile = createAsyncThunk(
  "users/updateProfile",
  async (formData, { rejectWithValue, getState }) => {
    try {
      const token = readToken(getState);
      if (!token) return rejectWithValue("Not authenticated");

      const data = await userApi.updateProfile(formData);
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to update profile");
    }
  }
);

export const deleteUserProfile = createAsyncThunk(
  "users/deleteProfile",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = readToken(getState);
      if (!token) return rejectWithValue("Not authenticated");

      const data = await userApi.deleteProfile();
      return data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to delete profile");
    }
  }
);
