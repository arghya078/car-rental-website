
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ForgotPasswordForm from '../../components/forms/ForgotPasswordForm';
import { forgotPasswordThunk } from '../../features/auth/authThunks';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector(s => s.auth || {});

  const onSubmit = async (data) => {
    // data: { email }
    const res = await dispatch(forgotPasswordThunk(data));
    if (res?.meta?.requestStatus === 'fulfilled') {
      // navigate to reset page with email prefilled
      navigate('/reset-password', { state: { email: data.email } });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
      <p className="text-sm text-slate-600 mb-3">Enter your email. We'll send an OTP to reset password.</p>

      <ForgotPasswordForm onSubmit={onSubmit} loading={loading} />

      {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
      {message && <div className="text-sm text-green-700 mt-3">{message}</div>}
    </div>
  );
}
