import React from 'react';
export default function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
