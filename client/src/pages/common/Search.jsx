
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchCars, fetchCarsForCustomers } from "../../features/cars/carThunks";
import CarList from "../../components/cars/CarList";
import Button from "../../components/ui/Button";

export default function Search() {
  const dispatch = useDispatch();
  const { searchResults = [], list = [], loading, error } = useSelector((s) => s.cars || {});

  const results = Array.isArray(searchResults) && searchResults.length ? searchResults : list;

  const [filters, setFilters] = React.useState({
    brand: "",
    type: "",
    location: "",
    minPrice: "",
    maxPrice: "",
    seatingCapacity: "",
  });

  React.useEffect(() => {
    dispatch(fetchCarsForCustomers());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const buildParams = (rawFilters) => {
    const params = {};
    Object.entries(rawFilters).forEach(([key, val]) => {
      if (val === "" || val === null || typeof val === "undefined") return;

      if (["minPrice", "maxPrice", "seatingCapacity"].includes(key)) {
        const n = Number(val);
        if (!Number.isNaN(n)) params[key] = n;
      } else {
        const s = String(val).trim();
        if (s) params[key] = s;
      }
    });
    return params;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = buildParams(filters);

    if (!Object.keys(params).length) {
      dispatch(fetchCarsForCustomers());
      return;
    }

    dispatch(searchCars(params));
  };

  const handleClear = () => {
    setFilters({
      brand: "",
      type: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      seatingCapacity: "",
    });

    dispatch(fetchCarsForCustomers());
    dispatch(searchCars({}));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Search Cars</h1>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <input
          name="brand"
          value={filters.brand}
          onChange={handleChange}
          className="border rounded p-2"
          placeholder="Brand"
        />
        <input
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="border rounded p-2"
          placeholder="Type (SUV, Sedan...)"
        />
        <input
          name="location"
          value={filters.location}
          onChange={handleChange}
          className="border rounded p-2"
          placeholder="Location"
        />
        <input
          type="number"
          name="minPrice"
          value={filters.minPrice}
          onChange={handleChange}
          className="border rounded p-2"
          placeholder="Min Price"
        />
        <input
          type="number"
          name="maxPrice"
          value={filters.maxPrice}
          onChange={handleChange}
          className="border rounded p-2"
          placeholder="Max Price"
        />
        <input
          type="number"
          name="seatingCapacity"
          value={filters.seatingCapacity}
          onChange={handleChange}
          className="border rounded p-2"
          placeholder="Seats"
        />

        <div className="md:col-span-3 flex justify-end gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
          <Button type="button" onClick={handleClear} disabled={loading}>
            Clear
          </Button>
        </div>
      </form>

      {/* Results */}
      <div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            <div className="mb-3 text-sm text-slate-600">
              {results.length ? `${results.length} result${results.length > 1 ? "s" : ""}` : "No cars found."}
            </div>

            {results?.length ? (
              <CarList cars={results} columns={3} />
            ) : (
              <div className="text-slate-500">No cars found. Try adjusting filters.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
