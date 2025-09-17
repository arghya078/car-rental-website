
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OtpForm from '../../components/forms/OtpForm';
import { verifyOtpThunk, resendOtpThunk } from '../../features/auth/authThunks';
import { useNavigate, useLocation } from 'react-router-dom';

export default function VerifyOtp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, message } = useSelector(s => s.auth || {});
  const [email, setEmail] = React.useState(location.state?.email || '');
  const [cooldown, setCooldown] = React.useState(0);
  const [resendLoading, setResendLoading] = React.useState(false);

  React.useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(c => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const onSubmit = async ({ email: formEmail, otp }) => {
    const targetEmail = (formEmail || email || '').trim();
    if (!targetEmail) {
      alert('Please provide your email');
      return;
    }
    const res = await dispatch(verifyOtpThunk({ email: targetEmail, otp }));
    if (res?.meta?.requestStatus === 'fulfilled') {
      navigate('/signin');
    }
  };

  const handleResend = async () => {
    const targetEmail = (email || '').trim();
    if (!targetEmail) {
      alert('Please enter your email to resend OTP.');
      return;
    }
    if (cooldown > 0 || resendLoading) return;
    try {
      setResendLoading(true);
      const res = await dispatch(resendOtpThunk({ email: targetEmail }));
      if (res?.meta?.requestStatus === 'fulfilled') {
        setCooldown(60); 
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Verify OTP</h2>
      <p className="text-sm text-slate-600 mb-3">Enter the OTP sent to your email.</p>

      <div className="mb-3">
        <label className="text-sm block mb-1">Email (used for resend)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <OtpForm onSubmit={onSubmit} loading={loading} defaultEmail={email} />

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resendLoading}
          aria-disabled={cooldown > 0 || resendLoading}
          className={`px-3 py-2 rounded text-sm ${
            cooldown > 0 || resendLoading ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-indigo-600'
          }`}
        >
          {resendLoading ? 'Resending...' : cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
        </button>

        <div>
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="text-sm text-slate-600 underline"
          >
            Back to sign in
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
      {message && <div className="text-sm text-green-700 mt-3">{message}</div>}
    </div>
  );
}
