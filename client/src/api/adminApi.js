
import axios from "./axiosInstance";

const getPendingOwners = (token) =>
  axios.get("/admin/owners/pending", { headers: { Authorization: `Bearer ${token}` } });

const getOwnerKycById = (id, token) =>
  axios.get(`/admin/owners/${id}/kyc`, { headers: { Authorization: `Bearer ${token}` } });

const approveOwner = (id, token) =>
  axios.put(`/admin/owners/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });

const rejectOwner = (id, payload, token) =>
  axios.put(`/admin/owners/${id}/reject`, payload, { headers: { Authorization: `Bearer ${token}` } });

const getApprovedOwners = (token) =>
  axios.get("/admin/approved-owners", { headers: { Authorization: `Bearer ${token}` } });

const getAllCustomers = (token) =>
  axios.get("/admin/customers", { headers: { Authorization: `Bearer ${token}` } });

const getCustomerDetails = (id, token) =>
  axios.get(`/admin/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } });

const getCustomerBookings = (id, token) =>
  axios.get(`/admin/customers/${id}/bookings`, { headers: { Authorization: `Bearer ${token}` } });

const deleteCustomer = (id, token) =>
  axios.delete(`/admin/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } });

const makeAdmin = (userId, token) =>
  axios.put(`/admin/make-admin/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });

// NEW: Get all bookings (admin)
const getAllBookings = (token) =>
  axios.get("/admin/bookings", { headers: { Authorization: `Bearer ${token}` } });

export default {
  getPendingOwners,
  getOwnerKycById,
  approveOwner,
  rejectOwner,
  getApprovedOwners,
  getAllCustomers,
  getCustomerDetails,
  getCustomerBookings,
  deleteCustomer,
  makeAdmin,
  getAllBookings,
};
