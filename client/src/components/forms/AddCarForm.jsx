
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Button from "../ui/Button";
import { useState, useEffect } from "react";
import { Camera, Trash2, Calendar, DollarSign, MapPin, Info, Check } from "lucide-react";

const allowedSeating = [2, 4, 5, 6, 7, 8, 9];
const MAX_IMAGES = 3;

const carTypes = ["SUV", "Sedan", "Hatchback", "Coupe", "Truck"];

const DEFAULT_CURRENCY = (import.meta.env.REACT_APP_DEFAULT_CURRENCY || "usd").toString().toUpperCase();

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

export default function AddCarForm({ onSubmit, loading, defaultValues = {} }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      isAvailable:
        defaultValues.isAvailable !== undefined ? String(defaultValues.isAvailable) : "true",
      type: defaultValues.type || carTypes[0],
      seatingCapacity:
        defaultValues.seatingCapacity !== undefined
          ? String(defaultValues.seatingCapacity)
          : String(allowedSeating.includes(defaultValues.seatingCapacity) ? defaultValues.seatingCapacity : allowedSeating[2]),
      ...defaultValues,
    },
  });

  const [images, setImages] = useState([]); 
  const [previews, setPreviews] = useState([]); 
  const [imageError, setImageError] = useState(null);

  const isAvailableWatch = watch(
    "isAvailable",
    defaultValues.isAvailable !== undefined ? String(defaultValues.isAvailable) : "true"
  );
  useEffect(() => {
    setValue("isAvailable", isAvailableWatch);
  }, [isAvailableWatch, setValue]);

  const onFilesChange = (e) => {
    setImageError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      previews.forEach((p) => URL.revokeObjectURL(p));
      setImages([]);
      setPreviews([]);
      return;
    }

    if (files.length > MAX_IMAGES) {
      const picked = files.slice(0, MAX_IMAGES);
      previews.forEach((p) => URL.revokeObjectURL(p));
      setImages(picked);
      setPreviews(picked.map((f) => URL.createObjectURL(f)));
      setImageError(`You can upload up to ${MAX_IMAGES} images. Only the first ${MAX_IMAGES} files were kept.`);
    } else {
      previews.forEach((p) => URL.revokeObjectURL(p));
      setImages(files);
      setPreviews(files.map((f) => URL.createObjectURL(f)));
    }
  };

  // remove single 
  const removeImage = (index) => {
    const nextImages = images.slice();
    const nextPreviews = previews.slice();
    // revoke object URL
    if (nextPreviews[index]) URL.revokeObjectURL(nextPreviews[index]);
    nextImages.splice(index, 1);
    nextPreviews.splice(index, 1);
    setImages(nextImages);
    setPreviews(nextPreviews);
    setImageError(null);
  };

  // cleanup object URLs on unmount
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

    images.slice(0, MAX_IMAGES).forEach((f) => formData.append("images", f));

    if (typeof onSubmit === "function") {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <Check size={20} className="text-emerald-600" /> Add your car for rent
        </h2>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Info size={16} /> <span>Fields marked * are required</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
          <input {...register("brand")} placeholder="e.g. Toyota" className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-indigo-100" />
          {errors.brand && <div className="text-xs text-rose-600 mt-1">{errors.brand.message}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
          <input {...register("model")} placeholder="e.g. Corolla" className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-indigo-100" />
          {errors.model && <div className="text-xs text-rose-600 mt-1">{errors.model.message}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Year *</label>
          <div className="relative">
            <input type="number" {...register("year")} placeholder="YYYY" className="border p-3 rounded-lg w-full pr-10 focus:ring-2 focus:ring-indigo-100" />
            <Calendar size={16} className="absolute right-3 top-3 text-slate-400" />
          </div>
          {errors.year && <div className="text-xs text-rose-600 mt-1">{errors.year.message}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
          <select {...register("type")} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-indigo-100">
            {carTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.type && <div className="text-xs text-rose-600 mt-1">{errors.type.message}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Seating capacity *</label>
          <select {...register("seatingCapacity")} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-indigo-100">
            {allowedSeating.map((s) => (
              <option key={s} value={s}>
                {s} seats
              </option>
            ))}
          </select>
          {errors.seatingCapacity && <div className="text-xs text-rose-600 mt-1">{errors.seatingCapacity.message}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Price per day ({DEFAULT_CURRENCY}) *</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              {...register("rentalPricePerDay")}
              placeholder={`e.g. ${DEFAULT_CURRENCY === "USD" ? "49.99" : "1500"}`}
              className="border p-3 rounded-lg w-full pr-10 focus:ring-2 focus:ring-indigo-100"
            />
            <DollarSign size={16} className="absolute right-3 top-3 text-slate-400" />
          </div>
          {errors.rentalPricePerDay && <div className="text-xs text-rose-600 mt-1">{errors.rentalPricePerDay.message}</div>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pickup location *</label>
          <div className="relative">
            <input {...register("pickupLocation")} placeholder="City / Address" className="border p-3 rounded-lg w-full pr-10 focus:ring-2 focus:ring-indigo-100" />
            <MapPin size={16} className="absolute right-3 top-3 text-slate-400" />
          </div>
          {errors.pickupLocation && <div className="text-xs text-rose-600 mt-1">{errors.pickupLocation.message}</div>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
          <textarea {...register("description")} placeholder="Add details — features, rules, notes..." className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-indigo-100" rows={4} />
          {errors.description && <div className="text-xs text-rose-600 mt-1">{errors.description.message}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
          <select {...register("isAvailable")} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-indigo-100">
            <option value="true">Available</option>
            <option value="false">Not available</option>
          </select>
        </div>
      </div>

      {/* Image uploader */}
      <div className="border border-dashed border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded">
              <Camera size={18} />
            </div>
            <div>
              <div className="font-medium text-slate-800">Car images</div>
              <div className="text-sm text-slate-500">Upload up to {MAX_IMAGES} images (recommended size: 1200*800)</div>
            </div>
          </div>
          <div className="text-sm text-slate-500">Selected: <span className="font-medium text-slate-700">{images.length}/{MAX_IMAGES}</span></div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700">
            <Camera size={16} />
            <span className="text-sm">Choose images</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={onFilesChange} />
          </label>

          {imageError && <div className="text-xs text-rose-600">{imageError}</div>}
        </div>

        {/* previews */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="relative group rounded overflow-hidden border">
              <img src={p} alt={`preview-${i}`} className="w-full h-32 object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label={`Remove image ${i + 1}`}
                className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 size={14} className="text-rose-600" />
              </button>
            </div>
          ))}
          {/* placeholder tiles when less than MAX_IMAGES */}
          {Array.from({ length: Math.max(0, MAX_IMAGES - previews.length) }).map((_, idx) => (
            <div key={`ph-${idx}`} className="flex items-center justify-center h-32 border rounded text-slate-400">
              <div className="text-sm">No image</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Tip: Good photos increase bookings — clean background & bright lighting work best.</div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading || images.length > MAX_IMAGES}>
            {loading ? "Saving..." : (
              <span className="inline-flex items-center gap-2">
                <Check size={14} /> Save
              </span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
