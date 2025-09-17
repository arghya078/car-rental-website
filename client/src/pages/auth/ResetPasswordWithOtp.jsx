
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ResetPasswordForm from '../../components/forms/ResetPasswordForm';
import { resetPasswordThunk } from '../../features/auth/authThunks';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ResetPasswordWithOtp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, message } = useSelector(s => s.auth || {});
  const defaultEmail = location.state?.email || '';

  const onSubmit = async (form) => {
    const payload = {
      email: form.email || defaultEmail,
      otp: form.otp,
      password: form.newPassword,
      confirmPassword: form.confirmPassword
    };

    const res = await dispatch(resetPasswordThunk(payload));
    if (res?.meta?.requestStatus === 'fulfilled') {
      navigate('/signin');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Reset Password</h2>

      <ResetPasswordForm onSubmit={onSubmit} loading={loading} />

      {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
      {message && <div className="text-sm text-green-700 mt-3">{message}</div>}
    </div>
  );
}
