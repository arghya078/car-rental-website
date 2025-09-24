
import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../../components/forms/LoginForm";
import { loginThunk } from "../../features/auth/authThunks";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (credentials) => {
    try {
      // dispatch 
      const res = await dispatch(loginThunk(credentials));

      if (res?.meta?.requestStatus === "fulfilled") {
        const dest = (location.state && location.state.from) || "/";
        navigate(dest, { replace: true });

        return { success: true };
      } else {
        const message =
          (res && (res.payload || res.error?.message)) ||
          "Invalid email or password. Please try again.";

        return { success: false, message };
      }
    } catch (e) {
      console.error("Login failed:", e);
      return { success: false, message: e?.message || "Login failed. Try again." };
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
