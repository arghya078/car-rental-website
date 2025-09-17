
import React from "react";
import CarCard from "./CarCard";

export default function CarList({ cars = [], columns = 3, showOwner = false }) {
  const colsClass = columns === 1 ? "grid-cols-1" : columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 ${colsClass} gap-4`}>
      {cars?.map((c) => (
        <CarCard key={c._id} car={c} showOwner={showOwner} />
      ))}
    </div>
  );
}
