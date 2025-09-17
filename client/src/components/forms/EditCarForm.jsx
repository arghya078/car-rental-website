
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Button from "../ui/Button";
import { useEffect, useState } from "react";
import { Camera, Trash2, Calendar, DollarSign, MapPin, Info, Check, RotateCw } from "lucide-react";

const allowedSeating = [2, 4, 5, 6, 7, 8, 9];
const MAX_IMAGES = 3;
const carTypes = ["SUV", "Sedan", "Hatchback", "Coupe", "Truck"];

const schema = yup.object().shape({
  brand: yup.string().trim().required("Brand is required"),
  model: yup.string().trim().required("Model is required"),
  year: yup
    .number()
    .typeError("Year must be a number")
    .integer("Year must be an integer")
    .min(1900, "Year seems invalid")
    .max(new Date().getFullYear() + 1, "Year seems invalid")
    .required("Year is required"),
  type: yup.string().trim().oneOf(carTypes, "Invalid car type").required("Type is required"),
  seatingCapacity: yup
    .number()
    .typeError("Seating capacity must be a number")
    .integer("Seating capacity must be an integer")
    .oneOf(allowedSeating, `Seating capacity must be one of: ${allowedSeating.join(", ")}`)
    .required("Seating capacity required"),
  rentalPricePerDay: yup
    .number()
    .typeError("Price must be a number")
    .positive("Price must be positive")
    .required("Price required"),
  pickupLocation: yup.string().trim().required("Pickup location required"),
  description: yup.string().max(2000, "Description too long").nullable(),
});

export default function EditCarForm({ initialValues = {}, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ...initialValues,
      isAvailable:
        initialValues.isAvailable !== undefined ? String(initialValues.isAvailable) : "true",
      type: initialValues.type || carTypes[0],
      seatingCapacity:
        initialValues.seatingCapacity !== undefined
          ? String(initialValues.seatingCapacity)
          : String(
              allowedSeating.includes(initialValues.seatingCapacity)
                ? initialValues.seatingCapacity
                : allowedSeating[2]
            ),
    },
  });

  useEffect(() => {
    reset({
      ...initialValues,
      isAvailable:
        initialValues.isAvailable !== undefined ? String(initialValues.isAvailable) : "true",
      type: initialValues.type || carTypes[0],
      seatingCapacity:
        initialValues.seatingCapacity !== undefined
          ? String(initialValues.seatingCapacity)
          : String(
              allowedSeating.includes(initialValues.seatingCapacity)
                ? initialValues.seatingCapacity
                : allowedSeating[2]
            ),
    });
    setVisibleExisting(Array.isArray(initialValues?.images) ? initialValues.images.slice() : []);
    setRemovedExisting([]);
  }, [initialValues, reset]);

  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageError, setImageError] = useState(null);

  const existing = Array.isArray(initialValues?.images) ? initialValues.images : [];
  const [visibleExisting, setVisibleExisting] = useState(existing);
  const [removedExisting, setRemovedExisting] = useState([]);

  const currentExistingCount = visibleExisting.length;
  const allowedNew = Math.max(0, MAX_IMAGES - currentExistingCount);

  const isAvailableWatch = watch(
    "isAvailable",
    initialValues.isAvailable !== undefined ? String(initialValues.isAvailable) : "true"
  );
  useEffect(() => {
    setValue("isAvailable", isAvailableWatch);
  }, [isAvailableWatch, setValue]);

  // helper
  const getExistingImageUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    // common image fields used by cloud storage libs
    return item.secure_url ?? item.url ?? item.path ?? "";
  };

  const onFilesChange = (e) => {
    setImageError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      previews.forEach((p) => URL.revokeObjectURL(p));
      setNewImages([]);
      setPreviews([]);
      return;
    }

    if (files.length > allowedNew) {
      const picked = files.slice(0, allowedNew);
      previews.forEach((p) => URL.revokeObjectURL(p));
      setNewImages(picked);
      setPreviews(picked.map((f) => URL.createObjectURL(f)));
      setImageError(
        `You can have up to ${MAX_IMAGES} images total. Only the first ${allowedNew} new files were kept.`
      );
    } else {
      previews.forEach((p) => URL.revokeObjectURL(p));
      setNewImages(files.slice(0, allowedNew));
      setPreviews(files.slice(0, allowedNew).map((f) => URL.createObjectURL(f)));
    }
    
    e.target.value = "";
  };

  const removeNewImage = (index) => {
    const nextNew = newImages.slice();
    const nextPreviews = previews.slice();
    if (nextPreviews[index]) URL.revokeObjectURL(nextPreviews[index]);
    nextNew.splice(index, 1);
    nextPreviews.splice(index, 1);
    setNewImages(nextNew);
    setPreviews(nextPreviews);
    setImageError(null);
  };

  const markRemoveExisting = (idx) => {
    const img = visibleExisting[idx];
    if (!img) return;
    const id = img?.public_id ?? img?.id ?? img?._id ?? img?.url ?? img;
    setRemovedExisting((r) => [...r, id]);
    const next = visibleExisting.slice();
    next.splice(idx, 1);
    setVisibleExisting(next);
  };

  const undoRemoveExisting = (id) => {
    if (!id) return;
    const findImage = (item) => {
      const candidateId = item?.public_id ?? item?.id ?? item?._id ?? item?.url ?? item;
      return String(candidateId) === String(id);
    };
    const img = existing.find(findImage);
    if (!img) return;
    setRemovedExisting((r) => r.filter((x) => String(x) !== String(id)));
    setVisibleExisting((v) => [...v, img]);
    setImageError(null);
  };

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (data) => {
    const formData = new FormData();
    formData.append("brand", String(data.brand));
    formData.append("model", String(data.model));
    formData.append("year", String(data.year));
    formData.append("type", String(data.type));
    formData.append("seatingCapacity", String(data.seatingCapacity));
    formData.append("rentalPricePerDay", String(data.rentalPricePerDay));
    formData.append("pickupLocation", String(data.pickupLocation));
    if (data.description) formData.append("description", String(data.description));
    formData.append("isAvailable", String(data.isAvailable ?? "true"));

    newImages
      .slice(0, Math.max(0, MAX_IMAGES - visibleExisting.length))
      .forEach((f) => formData.append("images", f));

    if (removedExisting.length) {
      formData.append("removedImages", JSON.stringify(removedExisting));
    }

    if (typeof onSubmit === "function") {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <Check size={20} className="text-emerald-600" /> Edit Car
        </h2>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Info size={16} /> <span>Fields marked * are required</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* brand */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
          <input {...register("brand")} placeholder="e.g. Toyota" className="border p-3 rounded-lg w-full" />
          {errors.brand && <div className="text-xs text-rose-600 mt-1">{errors.brand.message}</div>}
        </div>

        {/* model */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
          <input {...register("model")} placeholder="e.g. Corolla" className="border p-3 rounded-lg w-full" />
          {errors.model && <div className="text-xs text-rose-600 mt-1">{errors.model.message}</div>}
        </div>

        {/* year */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Year *</label>
          <div className="relative">
            <input type="number" {...register("year")} placeholder="YYYY" className="border p-3 rounded-lg w-full pr-10" />
            <Calendar size={16} className="absolute right-3 top-3 text-slate-400" />
          </div>
          {errors.year && <div className="text-xs text-rose-600 mt-1">{errors.year.message}</div>}
        </div>

        {/* type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
          <select {...register("type")} className="border p-3 rounded-lg w-full">
            {carTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.type && <div className="text-xs text-rose-600 mt-1">{errors.type.message}</div>}
        </div>

        {/* seating capacity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Seating capacity *</label>
          <select {...register("seatingCapacity")} className="border p-3 rounded-lg w-full">
            {allowedSeating.map((s) => (
              <option key={s} value={s}>{s} seats</option>
            ))}
          </select>
          {errors.seatingCapacity && <div className="text-xs text-rose-600 mt-1">{errors.seatingCapacity.message}</div>}
        </div>

        {/* price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Price per day (USD) *</label>
          <div className="relative">
            <input type="number" {...register("rentalPricePerDay")} placeholder="e.g. 50" className="border p-3 rounded-lg w-full pr-10" />
            <DollarSign size={16} className="absolute right-3 top-3 text-slate-400" />
          </div>
          {errors.rentalPricePerDay && <div className="text-xs text-rose-600 mt-1">{errors.rentalPricePerDay.message}</div>}
        </div>

        {/* pickup */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pickup location *</label>
          <div className="relative">
            <input {...register("pickupLocation")} placeholder="City / Address" className="border p-3 rounded-lg w-full pr-10" />
            <MapPin size={16} className="absolute right-3 top-3 text-slate-400" />
          </div>
          {errors.pickupLocation && <div className="text-xs text-rose-600 mt-1">{errors.pickupLocation.message}</div>}
        </div>

        {/* description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
          <textarea {...register("description")} placeholder="Add details" className="border p-3 rounded-lg w-full" rows={4} />
          {errors.description && <div className="text-xs text-rose-600 mt-1">{errors.description.message}</div>}
        </div>

        {/* availability */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
          <select {...register("isAvailable")} className="border p-3 rounded-lg w-full">
            <option value="true">Available</option>
            <option value="false">Not available</option>
          </select>
        </div>
      </div>

      {/* image uploader */}
      <div className="border border-dashed border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded">
              <Camera size={18} />
            </div>
            <div>
              <div className="font-medium text-slate-800">Car images</div>
              <div className="text-sm text-slate-500">Up to {MAX_IMAGES} images. First image is cover.</div>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Total: <span className="font-medium text-slate-700">{visibleExisting.length + newImages.length}/{MAX_IMAGES}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className={`inline-flex items-center gap-2 cursor-pointer bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 ${allowedNew === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
            <Camera size={16} />
            <span className="text-sm">Add images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={onFilesChange}
              disabled={allowedNew === 0}
            />
          </label>

          {imageError && <div className="text-xs text-rose-600">{imageError}</div>}
        </div>

        {/* existing images */}
        {visibleExisting.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-slate-600 mb-2">Existing images (you can remove)</div>
            <div className="grid grid-cols-3 gap-3">
              {visibleExisting.map((img, idx) => {
                const src = getExistingImageUrl(img);
                const id = img?.public_id ?? img?.id ?? img?._id ?? img?.url ?? img;
                return (
                  <div key={`exist-${id}-${idx}`} className="relative group rounded overflow-hidden border">
                    <img src={src} alt={`existing-${idx}`} className="w-full h-32 object-cover" />
                    <div className="absolute left-2 top-2 bg-white bg-opacity-80 rounded-md px-2 py-1 text-xs font-medium">#{idx+1}</div>
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => markRemoveExisting(idx)}
                        aria-label={`Remove existing image ${idx + 1}`}
                        className="bg-white bg-opacity-90 rounded-full p-1"
                      >
                        <Trash2 size={14} className="text-rose-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* removed existing preview (undo) */}
        {removedExisting.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-slate-600 mb-2">Removed images (undo available)</div>
            <div className="flex gap-2">
              {removedExisting.map((id) => (
                <div key={`removed-${id}`} className="flex items-center gap-2 bg-slate-50 p-2 rounded">
                  <div className="text-xs text-slate-700 break-all max-w-xs">{String(id)}</div>
                  <button
                    type="button"
                    onClick={() => undoRemoveExisting(id)}
                    className="inline-flex items-center gap-2 text-sm px-2 py-1 border rounded"
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* new image previews */}
        <div className="mt-4">
          <div className="text-sm text-slate-600 mb-2">New images</div>
          <div className="grid grid-cols-3 gap-3">
            {previews.map((p, i) => (
              <div key={`new-${i}`} className="relative group rounded overflow-hidden border">
                <img src={p} alt={`preview-${i}`} className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  aria-label={`Remove new image ${i + 1}`}
                  className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={14} className="text-rose-600" />
                </button>
              </div>
            ))}

            {/* placeholders */}
            {Array.from({ length: Math.max(0, MAX_IMAGES - (visibleExisting.length + previews.length)) }).map((_, idx) => (
              <div key={`ph-${idx}`} className="flex items-center justify-center h-32 border rounded text-slate-400">
                <div className="text-sm">No image</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Tip: Keep a clean cover photo as the first image.</div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading || (visibleExisting.length + newImages.length) > MAX_IMAGES}>
            {loading ? "Saving..." : (
              <span className="inline-flex items-center gap-2">
                <Check size={14} /> Save Changes
              </span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
