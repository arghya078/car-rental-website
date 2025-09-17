
import { createSlice } from '@reduxjs/toolkit';
import {
  registerThunk,
  verifyOtpThunk,
  loginThunk,
  logoutThunk,
  forgotPasswordThunk,
  resetPasswordThunk,
  resendOtpThunk
} from './authThunks';

const initialUser = JSON.parse(localStorage.getItem('user') || 'null');
const initialToken = localStorage.getItem('token') || null;

const initialState = {
  user: initialUser,
  token: initialToken,
  loading: false,
  error: null,
  message: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setUser(state, action) {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('user');
      }
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // register
      .addCase(registerThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(registerThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload?.message || 'OTP sent';
      })
      .addCase(registerThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message;
      })

      // verify otp
      .addCase(verifyOtpThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (s, a) => {
        s.loading = false;
        const { user, token, message } = a.payload || {};
        s.user = user || s.user;
        s.token = token || s.token;
        if (token) localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
        s.message = message || 'Verified';
      })
      .addCase(verifyOtpThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message;
      })

      // login 
      .addCase(loginThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false;
        const { user, token } = a.payload || {};
        s.user = user || null;
        s.token = token || null;
        if (token) localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message;
      })

      // logout
      .addCase(logoutThunk.fulfilled, (s) => {
        s.user = null;
        s.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      .addCase(logoutThunk.rejected, (s, a) => {
        s.user = null;
        s.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        s.error = a.payload || a.error?.message;
      })

      // forgot/reset/resend
      .addCase(forgotPasswordThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.message = null;
      })
      .addCase(forgotPasswordThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload?.message || 'OTP sent';
      })
      .addCase(forgotPasswordThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message;
      })

      .addCase(resetPasswordThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(resetPasswordThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload?.message || 'Password reset successful';
      })
      .addCase(resetPasswordThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message;
      })

      .addCase(resendOtpThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(resendOtpThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload?.message || 'OTP resent';
      })
      .addCase(resendOtpThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error?.message;
      });
  }
});

export const { logout, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
