import React from 'react';
export default function Input({ label, error, ...props }) {
  return (
    <label className="block mb-3">
      {label && <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>}
      <input
        className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
