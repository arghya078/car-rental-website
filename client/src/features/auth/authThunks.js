
import { createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../../api/authApi';
import userApi from '../../api/userApi';
import { setProfile } from '../users/userSlice';

// register (sends OTP)
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authApi.register(payload);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// verify OTP (after register)
export const verifyOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authApi.verifyOtp(payload);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// login 
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const res = await authApi.login(payload); 
      const token = res?.token;

      if (!token) {
        throw new Error('Login failed: no token returned');
      }

      localStorage.setItem('token', token);

      let user = null;
      try {
        const data = await userApi.getProfile(); 
        user = data?.user ?? data;
      } catch (err) {
        console.warn('Failed to fetch profile after login:', err);
        user = null;
      }

      if (user) {
        try {
          localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
          console.warn('Failed to persist user to localStorage', e);
        }

        dispatch(setProfile(user));
      } else {
        try {
          localStorage.removeItem('user');
          dispatch(setProfile(null));
        } catch (e) {
          console.warn('Failed to clear user from localStorage', e);
          // ignore
        }
      }

      return { token, user };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// logout 
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.logoutApi();
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// forgot password (send OTP)
export const forgotPasswordThunk = createAsyncThunk(
  'auth/forgotPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authApi.forgotPassword(payload);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// reset password with otp
export const resetPasswordThunk = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authApi.resetPasswordWithOtp(payload);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// resend otp
export const resendOtpThunk = createAsyncThunk(
  'auth/resendOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authApi.resendOtp(payload);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);
