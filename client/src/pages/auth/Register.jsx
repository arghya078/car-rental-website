
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import RegisterForm from "../../components/forms/RegisterForm";
import { registerThunk } from "../../features/auth/authThunks";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector((s) => s.auth || {});

  const onSubmit = async (data) => {
    const res = await dispatch(registerThunk(data));
    if (res?.meta?.requestStatus === "fulfilled") {
      navigate("/verify-otp", { state: { email: data.email, role: data.role } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg">
        <RegisterForm onSubmit={onSubmit} loading={loading} serverError={error && String(error)} />
        {message && <div className="text-sm text-green-700 mt-4 text-center">{message}</div>}
      </div>
    </div>
  );
}
