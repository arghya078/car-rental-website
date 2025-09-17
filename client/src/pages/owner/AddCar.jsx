
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { addCar } from "../../features/cars/carThunks";
import { useNavigate } from "react-router-dom";
import AddCarForm from "../../components/forms/AddCarForm";

export default function AddCarPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.cars || {});

  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

  const handleSubmit = async (formData) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await dispatch(addCar(formData));
      if (res?.meta?.requestStatus === "fulfilled") {
        setSuccess("Car added successfully. Redirecting to your cars...");
        setTimeout(() => {
          navigate("/owner/cars");
        }, 600);
      } else {
        const payload = res?.payload || res?.error;
        const message =
          (payload && (payload.message || payload.error || payload)) ||
          "Failed to add car. Please try again.";
        setError(typeof message === "string" ? message : JSON.stringify(message));
        // scroll to top so user sees the error
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("AddCar error", err);
      setError(err?.message || "Unexpected error. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div>

      {error && <div className="mb-4 text-sm text-rose-600">{error}</div>}
      {success && <div className="mb-4 text-sm text-green-700">{success}</div>}

      <AddCarForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
