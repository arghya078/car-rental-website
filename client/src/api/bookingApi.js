
import axios from "./axiosInstance";

const withAuth = (token) => ({ headers: token ? { Authorization: `Bearer ${token}` } : {} });

async function request(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    const normalized = err?.response?.data ?? { message: err?.message ?? "Request failed" };
    normalized.__original = err;
    throw normalized;
  }
}

// customer

const createBookingRequest = (payload, token) =>
  request(axios.post("/bookings/request", payload, withAuth(token)));

const cancelBooking = (bookingId, token) =>
  request(axios.post(`/bookings/${bookingId}/cancel`, {}, withAuth(token)));

const checkBookingBeforePayment = (bookingId, token) =>
  request(axios.post(`/bookings/${bookingId}/pay`, {}, withAuth(token)));


const proceedToPayment = (bookingId, token) => checkBookingBeforePayment(bookingId, token);

const getCustomerBookings = (token) =>
  request(axios.get("/bookings/customer/myBookings", withAuth(token)));

// owner

const getOwnerPendingBookings = (token) =>
  request(axios.get("/bookings/owner/requests", withAuth(token)));

const respondToBooking = (bookingId, action, token, reason = null) =>
  request(
    axios.put(
      `/bookings/${bookingId}/respond`,
      reason ? { action, reason } : { action },
      withAuth(token)
    )
  );

const getOwnerBookingsWithPayments = (token) =>
  request(axios.get("/bookings/owner/all", withAuth(token)));

// admin

const getAllBookingsForAdmin = (token) =>
  request(axios.get("/bookings/admin/allBookings", withAuth(token)));

// shared
const getBookingById = (id, token) =>
  request(axios.get(`/bookings/${id}`, withAuth(token)));

export default {
  createBookingRequest,
  cancelBooking,
  proceedToPayment,
  checkBookingBeforePayment,
  getCustomerBookings,

  getOwnerPendingBookings,
  respondToBooking,
  getOwnerBookingsWithPayments,

  getAllBookingsForAdmin,
  getBookingById,
};
