
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCarById, updateCar } from "../../features/cars/carThunks";
import { useNavigate, useParams } from "react-router-dom";
import EditCarForm from "../../components/forms/EditCarForm";

export default function EditCarPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { car, loading } = useSelector((s) => s.cars || {});

  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

  React.useEffect(() => {
    if (id) dispatch(fetchCarById(id));
  }, [dispatch, id]);

  const handleSubmit = async (formData) => {
    if (loading) return; 
    setError(null);
    setSuccess(null);

    try {
      const res = await dispatch(updateCar({ id, formData }));

      if (res?.meta?.requestStatus === "fulfilled") {
        setSuccess("Car updated successfully. Redirecting to your cars...");
        setTimeout(() => navigate("/owner/cars"), 600);
      } else {
        const payload = res?.payload || res?.error || {};
        const msg =
          (payload && (payload.message || payload.error || payload)) ||
          "Failed to update car. Please try again.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("updateCar error", err);
      setError(err?.message || "Unexpected error. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading && !car) return <div>Loading...</div>;

  const initialValues = {
    brand: car?.brand,
    model: car?.model,
    year: car?.year,
    type: car?.type,
    seatingCapacity: car?.seatingCapacity,
    rentalPricePerDay: car?.rentalPricePerDay,
    pickupLocation: car?.pickupLocation,
    description: car?.description,
    images: car?.images || [],
    isAvailable: car?.isAvailable !== undefined ? String(car.isAvailable) : "true",
  };

  return (
    <div>
      {error && <div className="mb-4 text-sm text-rose-600">{error}</div>}
      {success && <div className="mb-4 text-sm text-green-700">{success}</div>}

      <EditCarForm initialValues={initialValues} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}

