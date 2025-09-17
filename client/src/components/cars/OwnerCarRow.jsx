import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Modal from "../ui/Modal"; // adjust the path if Modal.jsx is elsewhere
import { motion } from "framer-motion";

export default function OwnerCarRow({ car, onDelete, onEdit }) {
  const id = car?._id ?? car?.id;
  const navigate = useNavigate();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const imageSrc =
    (Array.isArray(car?.images) &&
      car.images.length > 0 &&
      (car.images[0]?.url || car.images[0])) ||
    car.imageUrl ||
    "/placeholder-car.png";

  const handleEdit = () => {
    if (typeof onEdit === "function") return onEdit(id);
    navigate(`/owner/cars/edit/${id}`);
  };

  const handleDelete = async () => {
    if (typeof onDelete !== "function") return;
    try {
      setIsDeleting(true);
      setError("");
      await onDelete(id); // parent handles API + state update
      setDeleteOpen(false);
    } catch (err) {
      console.error(err);
      setError("Failed to delete this car. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        whileHover={{ translateY: -4, boxShadow: "0 8px 30px rgba(2,6,23,0.08)" }}
        className="bg-white p-3 rounded shadow-sm flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-28 h-20 bg-slate-100 rounded overflow-hidden flex-shrink-0">
            <img
              src={imageSrc}
              alt={`${car?.brand ?? ""} ${car?.model ?? ""}`}
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-car.png";
              }}
            />
          </div>

          <div className="min-w-0">
            <div className="font-semibold truncate">
              {(car?.brand || "") + (car?.model ? ` ${car.model}` : "")}
              {car?.year ? ` • ${car.year}` : ""}
            </div>
            <div className="text-sm text-slate-600 truncate">
              {car?.type ?? "—"} • {car?.seatingCapacity ?? "—"} seats •{" "}
              {car?.pickupLocation ?? "—"}
            </div>
            <div className="text-sm text-slate-700 mt-1">
              ₹{car?.rentalPricePerDay ?? car?.pricePerDay ?? "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleEdit}
            className="px-3 py-1 border rounded text-sm"
            aria-label={`Edit ${car?.brand ?? ""} ${car?.model ?? ""}`}
            whileTap={{ scale: 0.98 }}
          >
            Edit
          </motion.button>

          <motion.button
            onClick={() => setDeleteOpen(true)}
            className="px-3 py-1 border rounded text-sm text-red-600"
            aria-label={`Delete ${car?.brand ?? ""} ${car?.model ?? ""}`}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
          >
            Delete
          </motion.button>
        </div>
      </motion.div>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!isDeleting) setDeleteOpen(false);
        }}
        title="Delete Car"
      >
        <p className="text-slate-700 mb-3">
          Are you sure you want to delete{" "}
          <span className="font-semibold">
            {car?.brand} {car?.model} {car?.year ? `(${car.year})` : ""}
          </span>
          ? This action cannot be undone.
        </p>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <motion.button
            onClick={() => setDeleteOpen(false)}
            disabled={isDeleting}
            className="px-3 py-1 border rounded text-sm"
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>

          <motion.button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1 border rounded text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
            animate={isDeleting ? { opacity: 0.8 } : { opacity: 1 }}
            transition={{ duration: 0.12 }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </motion.button>
        </div>
      </Modal>
    </>
  );
}

OwnerCarRow.propTypes = {
  car: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
};
