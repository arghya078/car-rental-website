
import api from './axiosInstance';

export const register = (payload) => api.post('/auth/register', payload).then(r => r.data);
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload).then(r => r.data);
export const resendOtp = (payload) => api.post('/auth/resend-otp', payload).then(r => r.data);
export const login = (payload) => api.post('/auth/login', payload).then(r => r.data);
export const logoutApi = () => api.post('/auth/logout').then(r => r.data);
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload).then(r => r.data);
export const resetPasswordWithOtp = (payload) => api.post('/auth/reset-password-with-otp', payload).then(r => r.data);
