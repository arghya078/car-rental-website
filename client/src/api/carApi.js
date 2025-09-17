
import axios from "./axiosInstance";

const getCarsForCustomers = (params = {}) =>
  axios.get("/cars/customer/getAll", { params });

const searchCars = (params = {}) =>
  axios.get("/cars/customer/search", { params });

const getCarsForOwner = (token) =>
  axios.get("/cars/owner/getAll", { headers: { Authorization: `Bearer ${token}` } });

const addCar = (formData, token) =>
  axios.post("/cars/add", formData, {
    headers: { Authorization: `Bearer ${token}` },
  });

const updateCar = (id, formData, token) =>
  axios.put(`/cars/update/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });

const deleteCar = (id, token) =>
  axios.delete(`/cars/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });

const getCarsForAdmin = (token) =>
  axios.get("/cars/admin/getAll", { headers: { Authorization: `Bearer ${token}` } });

const getCarById = (id) => axios.get(`/cars/${id}`);

export default {
  getCarsForCustomers,
  searchCars,
  getCarsForOwner,
  addCar,
  updateCar,
  deleteCar,
  getCarsForAdmin,
  getCarById,
};
