
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCarsForOwner, deleteCar } from "../../features/cars/carThunks";
import { Link } from "react-router-dom";
import OwnerCarRow from "../../components/cars/OwnerCarRow";

export default function ManageCars() {
  const dispatch = useDispatch();
  const { ownerList = [], loading = false, error = null } = useSelector((s) => s.cars ?? {});

  React.useEffect(() => {
    dispatch(fetchCarsForOwner());
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this car? This cannot be undone.")) return;
    const res = await dispatch(deleteCar(id));
    if (res.meta.requestStatus === "fulfilled") {
      dispatch(fetchCarsForOwner());
    } else {
      console.warn('Delete failed', res.payload || res.error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Cars</h2>
        <Link to="/owner/cars/add" className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Car
        </Link>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : ownerList?.length ? (
        <div className="space-y-3">
          {ownerList.map((c) => (
            <OwnerCarRow key={c._id ?? c.id} car={c} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="text-slate-500">You have not added any cars yet.</div>
      )}
    </div>
  );
}
