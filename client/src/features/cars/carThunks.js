
import { createAsyncThunk } from "@reduxjs/toolkit";
import carApi from "../../api/carApi";

const getAuth = (getState) => {
  const state = getState();
  const token = state?.auth?.token || localStorage.getItem("token") || null;
  const role = state?.auth?.user?.role || null;
  return { token, role };
};

// fetch cars for customers
export const fetchCarsForCustomers = createAsyncThunk(
  "cars/fetchCustomers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await carApi.getCarsForCustomers(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// search cars
export const searchCars = createAsyncThunk(
  "cars/search",
  async (params = {}, { rejectWithValue }) => {
    try {
      const isEmptyParams =
        params == null ||
        (typeof params === "object" && Object.keys(params).length === 0);

      const resp = isEmptyParams
        ? await carApi.getCarsForCustomers()
        : await carApi.searchCars(params);

      const data = resp?.data ?? resp;

      let carsArray =
        Array.isArray(data) ? data :
        Array.isArray(data?.cars) ? data.cars :
        Array.isArray(data?.results) ? data.results :
        Array.isArray(data?.data) ? data.data :
        Array.isArray(data?.items) ? data.items : [];

      if (!carsArray.length && data && typeof data === "object") {
        for (const k of Object.keys(data)) {
          if (Array.isArray(data[k])) {
            carsArray = data[k];
            break;
          }
        }
      }

      return carsArray || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// fetch cars for owner
export const fetchCarsForOwner = createAsyncThunk(
  "cars/fetchOwner",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuth(getState);
      const { data } = await carApi.getCarsForOwner(token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// fetch cars for admin
export const fetchCarsForAdmin = createAsyncThunk(
  "cars/fetchAdmin",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuth(getState);
      const { data } = await carApi.getCarsForAdmin(token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// fetch car by id
export const fetchCarById = createAsyncThunk(
  "cars/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await carApi.getCarById(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// add car
export const addCar = createAsyncThunk(
  "cars/addCar",
  async (formData, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuth(getState);
      const { data } = await carApi.addCar(formData, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// update car
export const updateCar = createAsyncThunk(
  "cars/updateCar",
  async ({ id, formData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuth(getState);
      const { data } = await carApi.updateCar(id, formData, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// delete car
export const deleteCar = createAsyncThunk(
  "cars/deleteCar",
  async (id, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuth(getState);
      const { data } = await carApi.deleteCar(id, token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
