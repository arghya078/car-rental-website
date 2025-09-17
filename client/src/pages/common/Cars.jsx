// src/pages/common/Cars.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchCarsForCustomers,
  searchCars,
} from "../../features/cars/carThunks";
import CarList from "../../components/cars/CarList";
import Spinner from "../../components/ui/Spinner";
import Pagination from "../../components/ui/Pagination";
import { Search, X, MapPin } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Cars() {
  const dispatch = useDispatch();
  const {
    list = [],
    searchResults = [],
    loading,
    error,
  } = useSelector((s) => s.cars || {});

  // local fallback results when server returns empty
  const [localResults, setLocalResults] = useState(null);

  // Helper: normalize backend shapes into a plain array
  const normalize = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.cars)) return raw.cars;
    if (raw && Array.isArray(raw.results)) return raw.results;
    if (raw && Array.isArray(raw.data)) return raw.data;
    if (raw && Array.isArray(raw.items)) return raw.items;
    return [];
  };

  // prefer localResults (client-side fallback) when set,
  // otherwise prefer searchResults when present, otherwise use list
  const searchArray = normalize(searchResults);
  const listArray = normalize(list);
  const results =
    localResults !== null ? localResults : (searchArray.length ? searchArray : listArray);

  // two simple filters: type and location (brand removed)
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");

  // pagination
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((results?.length || 0) / PAGE_SIZE));

  // fetch canonical list on mount
  useEffect(() => {
    // keep behavior: fetch canonical list on mount and clear any local fallback afterwards
    dispatch(fetchCarsForCustomers()).then(() => {
      // we intentionally clear local fallback on mount
      setLocalResults(null);
      // optionally, if you want to immediately show fetched list as localResults, you could:
      // const fetched = normalize(action?.payload);
      // setLocalResults(fetched.length ? fetched : null);
    });
  }, [dispatch]);

  // ensure page remains valid when results change
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [results, totalPages, page]);

  const buildParams = () => {
    const params = {};
    const typeTrim = type?.trim();
    if (typeTrim) params.type = typeTrim;
    const locTrim = location?.trim();
    if (locTrim) params.location = locTrim;
    return params;
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const params = buildParams();

    setPage(1);

    // if no params, fetch canonical list and clear fallback
    if (!Object.keys(params).length) {
      await dispatch(fetchCarsForCustomers());
      setLocalResults(null);
      return;
    }

    try {
      const action = await dispatch(searchCars(params));
      const payload = action?.payload ?? [];
      // thunk returns { cars, meta } shape in your thunk; handle both shapes
      const serverArray =
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.cars)
          ? payload.cars
          : [];

      if (serverArray.length > 0) {
        // server returned matches — use them and clear fallback
        setLocalResults(null);
      } else {
        // server returned empty -> fallback to client-side filter of canonical list
        const typeTrim = (params.type || "").toLowerCase();
        const locTrim = (params.location || "").toLowerCase();

        const filtered = listArray.filter((c) => {
          try {
            // create a compact searchable string from common fields + JSON dump
            const summary = [
              c.brand, c.make, c.model, c.type, c.category,
              c.name, c.title, c.description,
              c.owner?.name, c.ownerName, c.ownerDetails?.name,
              c.location, c.city, c.place
            ].filter(Boolean).join(" ").toLowerCase();

            const dump = JSON.stringify(c).toLowerCase();
            const hay = summary + " " + dump;

            const matchesType = !typeTrim || hay.includes(typeTrim);
            const matchesLoc = !locTrim || hay.includes(locTrim);

            return matchesType && matchesLoc;
          } catch (err) {
            console.error("[Cars] search fallback error:", err);
            // fallback: simple field checks
            const t = String(c.type || c.category || "").toLowerCase();
            const l = String(c.location || c.city || "").toLowerCase();
            const matchesType = !typeTrim || t.includes(typeTrim);
            const matchesLoc = !locTrim || l.includes(locTrim);
            return matchesType && matchesLoc;
          }
        });

        setLocalResults(filtered);
      }
    } catch (err) {
      console.error("[Cars] search dispatch error:", err);
      setLocalResults(null);
      dispatch(fetchCarsForCustomers());
    }
  };

  const handleClear = async () => {
    // clear UI filters immediately
    setType("");
    setLocation("");
    setPage(1);

    try {
      // fetch canonical list and then use that fetched data locally so the UI shows it
      const action = await dispatch(fetchCarsForCustomers());
      const payload = action?.payload ?? [];
      const fetchedArray = normalize(payload);

      // if fetch returned usable data, use it as localResults so we override any lingering searchResults in store
      if (Array.isArray(fetchedArray) && fetchedArray.length > 0) {
        setLocalResults(fetchedArray);
      } else {
        // if nothing meaningful returned, clear localResults to fall back to store list
        setLocalResults(null);
      }
    } catch (err) {
      // ignore — we still clear localResults and show whatever we have
      console.error("Failed to fetch canonical list on clear:", err);
      setLocalResults(null);
    }
  };

  // paginated slice
  const paginatedResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return Array.isArray(results) ? results.slice(start, start + PAGE_SIZE) : [];
  }, [results, page]);

  const total = results?.length || 0;
  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">Cars for Rent</h2>
          <p className="text-sm text-slate-500 mt-1">
            Search and book reliable cars — filter by type or location.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/search" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm">
            Advanced Search
          </Link>
        </div>
      </div>

      {/* Simple search form: Type / Location */}
      <form onSubmit={handleSearch} className="mb-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        <div className="col-span-1 md:col-span-2">
          <label className="sr-only" htmlFor="type-search">Type</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={16} /></span>
            <input
              id="type-search"
              aria-label="Search by type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Type (SUV, Sedan...)"
              className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {type && (
              <button type="button" onClick={() => setType("")} aria-label="Clear type" className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="sr-only" htmlFor="car-location">Location</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><MapPin size={16} /></span>
            <input
              id="car-location"
              aria-label="Search by location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-start md:justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-60">
            Search
          </button>
          <button type="button" onClick={handleClear} disabled={loading} className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white border border-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-200 transition">
            Clear
          </button>
        </div>
      </form>

      {/* Active filters pill */}
      {(type || location) && (
        <div className="mb-4 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full text-sm text-slate-700 shadow-sm">
            <strong className="mr-1">Filters:</strong>
            {type ? <span className="px-2 py-1 rounded bg-white border">{type}</span> : null}
            {location ? <span className="px-2 py-1 rounded bg-white border">{location}</span> : null}
            <button type="button" onClick={handleClear} className="ml-2 text-xs text-slate-500 hover:text-slate-700" aria-label="Clear filters">Clear filters</button>
          </div>
        </div>
      )}

      {/* content */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded">
            <Spinner size={64} thickness={7} label="Loading cars" />
          </div>
        )}

        {error ? (
          <div className="p-4 mb-4 bg-red-50 border border-red-100 rounded text-red-700">{error}</div>
        ) : (
          <>
            {/* Results header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-slate-600">{total ? `${total} result${total > 1 ? "s" : ""}` : "No cars found."}</div>
              <div className="text-sm text-slate-500">{total > 0 ? <>Showing <strong className="text-slate-700">{startIndex}</strong>–<strong className="text-slate-700">{endIndex}</strong> of {total}</> : null}</div>
            </div>

            {paginatedResults?.length ? (
              <div className="transition-opacity duration-200">
                <CarList cars={paginatedResults} columns={3} />
              </div>
            ) : (
              <div className="p-8 text-center rounded border border-dashed border-slate-100">
                <p className="text-slate-600 mb-3">No cars matched your search.</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={handleClear} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Reset filters</button>
                  <Link to="/" className="text-sm text-slate-500 hover:underline">Go to home</Link>
                </div>
              </div>
            )}

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="mt-6 flex items-center justify-center">
                <Pagination page={page} totalPages={totalPages} onChange={(p) => setPage(p)} siblingCount={1} boundaryCount={1} size="md" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
