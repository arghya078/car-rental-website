// src/pages/admin/Cars.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCarsForAdmin, deleteCar } from "../../features/cars/carThunks";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, RefreshCw } from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal"; // adjust path if needed
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function AdminCars() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const { adminList = [], loading = false, error = null } = useSelector(
    (s) => s.cars || {}
  );

  useEffect(() => {
    dispatch(fetchCarsForAdmin());
  }, [dispatch]);

  // modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const openDelete = (car) => {
    setSelectedCar(car);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    if (!isDeleting) {
      setDeleteOpen(false);
      setSelectedCar(null);
      setDeleteError("");
    }
  };

  const confirmDelete = async () => {
    if (!selectedCar) return;
    try {
      setIsDeleting(true);
      setDeleteError("");
      const res = await dispatch(deleteCar(selectedCar._id));
      if (res?.meta?.requestStatus === "fulfilled") {
        // success
        setDeleteOpen(false);
        setSelectedCar(null);
        // refetch list
        dispatch(fetchCarsForAdmin());
      } else {
        const payload = res?.payload || res?.error?.message;
        setDeleteError(payload || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      setDeleteError("Delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = (id) => {
    navigate(`/cars/${id}`);
  };

  if (loading) {
    return Spinner ? <Spinner /> : <div className="p-6 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!adminList?.length) {
    return <div className="p-6 text-slate-500">No cars found.</div>;
  }

  // motion variants
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <motion.h2
            initial={reduceMotion ? {} : { opacity: 0, x: -8 }}
            animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3"
          >
            <span>🚗 All Cars (Admin)</span>
            <span className="ml-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-50 via-rose-100 to-indigo-50 text-rose-700 text-sm font-semibold ring-1 ring-rose-100">
              <span className="text-xs">Total</span>
              <span className="text-lg">{adminList.length}</span>
            </span>
          </motion.h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Manage the platform fleet — inspect, review and remove listings. Deletions are permanent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => dispatch(fetchCarsForAdmin())}
            whileTap={reduceMotion ? {} : { scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md transition transform hover:-translate-y-0.5"
            aria-label="Refresh cars"
          >
            <RefreshCw size={18} /> Refresh
          </motion.button>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {adminList.map((car) => (
            <motion.article
              key={car._id}
              className="relative bg-gradient-to-b from-white to-slate-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition transform"
              variants={cardVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 8, transition: { duration: 0.18 } }}
              whileHover={reduceMotion ? {} : { y: -8, boxShadow: "0 18px 40px rgba(15,23,42,0.12)" }}
            >
              {/* top ribbon gradient */}
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-500" />

              {/* soft vignette */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-white/70 opacity-20" />

              {/* Car Image */}
              <div className="h-44 bg-slate-100 border-b">
                {car.images?.[0]?.url ? (
                  <img
                    src={car.images[0].url}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    No image
                  </div>
                )}
              </div>

              {/* Car Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                    {car.brand} {car.model}
                  </h3>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-500">
                      {car.type} • {car.seatingCapacity} seats
                    </div>

                    <div className="text-sm text-rose-600 font-semibold">
                      ₹{car.rentalPricePerDay}/day
                    </div>
                  </div>

                  {car.ownerDetails?.name && (
                    <div className="text-xs text-slate-500 mt-2">Owner: {car.ownerDetails.name}</div>
                  )}
                </div>

                {/* bottom row */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* small color previews if available */}
                    {((car.colors && car.colors.length > 0) || car.color) && (
                      <div className="flex items-center gap-2">
                        {car.colors && car.colors.length > 0
                          ? car.colors.slice(0, 3).map((c, i) => (
                              <span
                                key={`${car._id}-color-${i}`}
                                className="w-3 h-3 rounded-full border"
                                title={String(c)}
                                style={{ backgroundColor: String(c) }}
                              />
                            ))
                          : car.color ? (
                              <span
                                className="w-3 h-3 rounded-full border"
                                title={String(car.color)}
                                style={{ backgroundColor: String(car.color) }}
                              />
                            ) : null}
                        <span className="text-xs text-slate-500 ml-1">Colour</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleView(car._id)}
                      title="View"
                      aria-label={`View car ${car.brand} ${car.model}`}
                      whileTap={reduceMotion ? {} : { scale: 0.96 }}
                      className="p-2 rounded-full hover:bg-slate-100 transition"
                    >
                      <Eye size={18} className="text-indigo-600" />
                    </motion.button>

                    <motion.button
                      onClick={() => openDelete(car)}
                      title="Delete"
                      aria-label={`Delete car ${car.brand} ${car.model}`}
                      whileTap={reduceMotion ? {} : { scale: 0.96 }}
                      className="p-2 rounded-full hover:bg-slate-100 transition"
                    >
                      <Trash2 size={18} className="text-rose-600" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteOpen} onClose={closeDelete} title="Delete car">
        <div className="flex items-start gap-3">
          <div className="w-20 h-14 bg-slate-100 rounded overflow-hidden flex-shrink-0">
            {selectedCar?.images?.[0]?.url ? (
              <img
                src={selectedCar.images[0].url}
                alt={`${selectedCar.brand} ${selectedCar.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
                No image
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-slate-700 mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {selectedCar?.brand} {selectedCar?.model} {selectedCar?.year ? `(${selectedCar.year})` : ""}
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && <p className="text-red-600 text-sm mb-2">{deleteError}</p>}

            <div className="flex justify-end gap-2 mt-3">
              <button onClick={closeDelete} disabled={isDeleting} className="px-3 py-1 border rounded text-sm">
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3 py-1 border rounded text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
