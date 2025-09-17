
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCarsForCustomers,
  searchCars,
  fetchCarsForOwner,
  fetchCarsForAdmin,
  fetchCarById,
  addCar,
  updateCar,
  deleteCar,
} from "./carThunks";

const initialState = {
  list: [],
  adminList: [],
  ownerList: [],
  car: null,

  searchResults: [],

  searchMeta: {
    total: 0,
    page: 1,
    pages: 0,
    results: 0,
  },

  loading: false,
  error: null,
  message: null,
};

const carSlice = createSlice({
  name: "cars",
  initialState,
  reducers: {
    clearCarError(state) {
      state.error = null;
    },
    clearCarMessage(state) {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCarsForCustomers.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchCarsForCustomers.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload || [];
      })
      .addCase(fetchCarsForCustomers.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // search
      .addCase(searchCars.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(searchCars.fulfilled, (s, a) => {
        s.loading = false;
        s.error = null;

        const payload = a.payload;

        if (!payload) {
          s.searchResults = [];
          return;
        }

        if (Array.isArray(payload)) {
          s.searchResults = payload;
          return;
        }
         
        // if pagination is present
        if (Array.isArray(payload.cars)) {
          s.searchResults = payload.cars;
          s.searchMeta = {
            total: Number(payload.total ?? payload.results ?? s.searchMeta.total) || 0,
            page: Number(payload.page ?? s.searchMeta.page) || 1,
            pages: Number(payload.pages ?? s.searchMeta.pages) || 0,
            results: Number(payload.results ?? s.searchMeta.results) || 0,
          };
          return;
        }

        if (Array.isArray(payload.list)) {
          s.searchResults = payload.list;
          return;
        }

        s.searchResults = [];
      })
      .addCase(searchCars.rejected, (s, a) => {
        s.loading = false;
        s.searchResults = []; 
        s.error = a.payload || a.error.message;
      })

      // fetchCarsForOwner
      .addCase(fetchCarsForOwner.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchCarsForOwner.fulfilled, (s, a) => {
        s.loading = false;
        s.ownerList = a.payload || [];
      })
      .addCase(fetchCarsForOwner.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // fetchCarsForAdmin
      .addCase(fetchCarsForAdmin.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchCarsForAdmin.fulfilled, (s, a) => {
        s.loading = false;
        s.adminList = a.payload || [];
      })
      .addCase(fetchCarsForAdmin.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // fetchCarById
      .addCase(fetchCarById.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(fetchCarById.fulfilled, (s, a) => {
        s.loading = false;
        s.car = a.payload;
      })
      .addCase(fetchCarById.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // addCar
      .addCase(addCar.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(addCar.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload?.message || "Car added";
        if (a.payload?.car) s.ownerList.unshift(a.payload.car);
      })
      .addCase(addCar.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // updateCar
      .addCase(updateCar.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(updateCar.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload?.message || "Car updated";
      })
      .addCase(updateCar.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // deleteCar 
      .addCase(deleteCar.pending, (s) => ({ ...s, loading: true, error: null }))
      .addCase(deleteCar.fulfilled, (s, a) => {
        s.loading = false;
        s.message = a.payload?.message || "Car deleted";
        const id = a.meta?.arg;
        s.ownerList = s.ownerList?.filter((c) => String(c._id) !== String(id));
        s.adminList = s.adminList?.filter((c) => String(c._id) !== String(id));
        s.list = s.list?.filter((c) => String(c._id) !== String(id));
        s.searchResults = s.searchResults?.filter((c) => String(c._id) !== String(id));
      })
      .addCase(deleteCar.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      });
  },
});

export const { clearCarError, clearCarMessage } = carSlice.actions;
export default carSlice.reducer;
