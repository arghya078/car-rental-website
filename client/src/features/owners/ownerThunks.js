
import { createAsyncThunk } from "@reduxjs/toolkit";
import ownerApi from "../../api/ownerApi";
import { setProfile } from "../users/userSlice";
import { setUser } from "../auth/authSlice";

const getToken = (getState) => getState?.auth?.token || localStorage.getItem("token") || null;

// submit kyc
export const submitKyc = createAsyncThunk(
  "owners/submitKyc",
  async (formData, { rejectWithValue, getState, dispatch }) => {
    try {
      const token = getToken(getState);
      const { data } = await ownerApi.submitKyc(formData, token);

      const updatedUser = data?.user ?? data;
      if (updatedUser && typeof updatedUser === "object") {
        try {
          dispatch(setProfile(updatedUser));
        } catch (e) {
          console.warn("failed to dispatch setProfile", e);
        }
        try {
          dispatch(setUser(updatedUser));
        } catch (e) {
          console.warn("failed to dispatch setUser", e);
        }
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
