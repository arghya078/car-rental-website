
import { createAsyncThunk } from "@reduxjs/toolkit";
import bookingApi from "../../api/bookingApi";
import paymentApi from "../../api/paymentApi";
import carApi from "../../api/carApi";
import * as userApiModule from "../../api/userApi"; 

const getToken = (maybeGetState) => {
  try {
    const state = typeof maybeGetState === "function" ? maybeGetState() : maybeGetState;
    return state?.auth?.token || localStorage.getItem("token") || null;
  } catch (e) {
    console.error("Error getting token:", e);
    return localStorage.getItem("token") || null;
  }
};

//customer thunks

export const createBookingRequest = createAsyncThunk(
  "bookings/createRequest",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const data = await bookingApi.createBookingRequest(payload, token); 
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to create booking");
    }
  }
);

export const cancelBookingRequest = createAsyncThunk(
  "bookings/cancel",
  async (bookingId, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const data = await bookingApi.cancelBooking(bookingId, token);
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to cancel booking");
    }
  }
);

export const fetchCustomerBookings = createAsyncThunk(
  "bookings/fetchCustomer",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const data = await bookingApi.getCustomerBookings(token);
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to fetch customer bookings");
    }
  }
);

// owner thunks

export const fetchOwnerPendingBookings = createAsyncThunk(
  "bookings/fetchOwnerPending",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const data = await bookingApi.getOwnerPendingBookings(token);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.bookings)) return data.bookings;
      return [];
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to fetch owner pending bookings");
    }
  }
);

export const fetchOwnerBookingsWithPayments = createAsyncThunk(
  "bookings/fetchOwnerAll",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const data = await bookingApi.getOwnerBookingsWithPayments(token);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.bookings)) return data.bookings;
      return [];
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to fetch owner bookings");
    }
  }
);


export const respondToBooking = createAsyncThunk(
  "bookings/respond",
  async ({ bookingId, action, reason = null }, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const data = await bookingApi.respondToBooking(bookingId, action, token, reason);
      return data?.booking ?? data ?? null;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to respond to booking");
    }
  }
);

// admin thunks

export const fetchAllBookingsForAdmin = createAsyncThunk(
  "bookings/fetchAdminAll",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const data = await bookingApi.getAllBookingsForAdmin(token);
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to fetch admin bookings");
    }
  }
);

// payment thunks
export const initiatePayment = createAsyncThunk(
  "bookings/initiatePayment",
  async (bookingId, { rejectWithValue, getState }) => {
    if (!bookingId) return rejectWithValue("bookingId is required");
    try {
      const token = getToken(getState);

      let checkData;
      try {
        checkData = await bookingApi.checkBookingBeforePayment(bookingId, token);
      } catch (err) {
        return rejectWithValue(err?.message || err || "Booking check failed");
      }

      const currency = (checkData.currency || checkData.currency_code || "usd").toString().toLowerCase();
      if (currency !== "usd") {
        return rejectWithValue(
          `Booking currency is ${currency}. PayPal integration requires booking amounts in USD. Please convert before proceeding.`
        );
      }

      const amountMajor = Number(checkData.amount ?? checkData.displayAmount ?? checkData.totalPrice ?? 0);
      if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
        return rejectWithValue("Invalid booking amount for payment");
      }

      let data;
      try {
        data = await paymentApi.initiatePayment(bookingId, token);
      } catch (err) {
        return rejectWithValue(err?.message || err || "Failed to initiate payment");
      }

      const payload = {
        orderId: data.orderId ?? data.id ?? (data.order && data.order.id) ?? null,
        paymentId: data.paymentId ?? (data.payment && (data.payment._id || data.payment.id)) ?? null,
        displayAmount:
          data.displayAmount ??
          (data.amount ? Number(data.amount) : data.totalPrice ? Number(data.totalPrice) : amountMajor),
        amountInPaise:
          data.amountInPaise ??
          data.amountInCents ??
          (typeof data.displayAmount === "number" ? Math.round(Number(data.displayAmount) * 100) : null) ??
          (amountMajor ? Math.round(Number(amountMajor) * 100) : null),
        currency: (data.currency ?? data.currency_code ?? currency ?? "usd").toString().toLowerCase(),
        bookingId: bookingId,
        status: data.status ?? (data.payment && data.payment.status) ?? null,
        raw: data,
      };

      return payload;
    } catch (err) {
      return rejectWithValue(err?.message || err || "Failed to initiate payment");
    }
  }
);

// helpers

async function fetchUserById(id, token) {
  if (!id) return null;

  const tryCall = async (fn) => {
    if (typeof fn !== "function") return null;
    try {
      const res = await fn(id, token); 
      return res?.user ?? res;
    } catch (e) {
      console.warn("fetchUserById attempt failed:", e?.message || e);
      return null;
    }
  };

  const tries = [
    userApiModule.getUserById,
    userApiModule.getUser,
    userApiModule.getUserProfile,
    userApiModule.fetchUserById,
    userApiModule.getUserByIdPublic,
  ];

  for (const fn of tries) {
    try {
      const out = await tryCall(fn);
      if (out) return out.user ?? out;
    } catch (e) {
      console.warn("fetchUserById attempt failed:", e?.message || e);
      continue;
    }
  }

  return null;
}

async function findBookingInListsAndEnrich(id, token) {
  const findInList = (list, idToFind) => {
    if (!Array.isArray(list)) return null;
    return list.find((b) => String(b._id) === String(idToFind) || String(b.id) === String(idToFind)) || null;
  };

  try {
    const custList = await bookingApi.getCustomerBookings(token).catch(() => null);
    let found = findInList(custList, id);

    if (!found) {
      const ownerList = await bookingApi.getOwnerBookingsWithPayments(token).catch(() => null);
      found = findInList(ownerList, id);

      if (!found) {
        const adminList = await bookingApi.getAllBookingsForAdmin(token).catch(() => null);
        found = findInList(adminList, id);
      }
    }

    if (!found) return null;

    const booking = { ...found };

    try {
      const carCandidate = booking.car || booking.vehicle || null;
      let carId = null;
      if (carCandidate) {
        if (typeof carCandidate === "string") carId = carCandidate;
        else if (carCandidate._id) carId = carCandidate._id;
        else if (carCandidate.id) carId = carCandidate.id;
      }

      const needsCarFetch =
        !carCandidate ||
        (typeof carCandidate === "object" &&
          (carCandidate.year === undefined || carCandidate.seatingCapacity === undefined || !carCandidate.images));

      if (carId && needsCarFetch) {
        const carObj = await carApi.getCarById(carId).catch(() => null);
        if (carObj) booking.car = carObj;
      }
    } catch (e) {
      console.warn("Failed to enrich car for booking:", e);
    }

    try {
      const ownerCandidate = booking.owner || booking.ownerDetails || booking.host || null;
      let ownerId = null;
      if (ownerCandidate) {
        if (typeof ownerCandidate === "string") ownerId = ownerCandidate;
        else if (ownerCandidate._id) ownerId = ownerCandidate._id;
        else if (ownerCandidate.id) ownerId = ownerCandidate.id;
      }

      const needsOwnerFetch =
        !ownerCandidate ||
        (typeof ownerCandidate === "object" && (ownerCandidate.phone === undefined || ownerCandidate.address === undefined));

      if (ownerId && needsOwnerFetch) {
        const ownerFull = await fetchUserById(ownerId, token).catch(() => null);
        if (ownerFull) booking.owner = ownerFull;
      }
    } catch (e) {
      console.warn("Failed to enrich owner for booking:", e);
    }

    try {
      const customerCandidate = booking.customer || booking.user || booking.customerDetails || null;
      let customerId = null;
      if (customerCandidate) {
        if (typeof customerCandidate === "string") customerId = customerCandidate;
        else if (customerCandidate._id) customerId = customerCandidate._id;
        else if (customerCandidate.id) customerId = customerCandidate.id;
      }

      const needsCustomerFetch =
        !customerCandidate ||
        (typeof customerCandidate === "object" && (customerCandidate.phone === undefined || customerCandidate.name === undefined));

      if (customerId && needsCustomerFetch) {
        const custFull = await fetchUserById(customerId, token).catch(() => null);
        if (custFull) booking.customer = custFull;
      }
    } catch (e) {
      console.warn("Failed to enrich customer for booking:", e);
    }

    return booking;
  } catch (e) {
    console.error("findBookingInListsAndEnrich failed:", e);
    return null;
  }
}

// Fetch a single booking

export const fetchBookingById = createAsyncThunk(
  "bookings/fetchById",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);

      try {
        const res = await bookingApi.getBookingById(id, token);
        const payload = res?.booking ?? res ?? null;
        if (payload) {
          return payload;
        }
      } catch (err) {
        console.warn("bookingApi.getBookingById failed, falling back to list search:", err?.status || err?.message || err);
      }

      const fallback = await findBookingInListsAndEnrich(id, token);
      if (fallback) return fallback;

      return rejectWithValue("Booking not found");
    } catch (err) {
      return rejectWithValue(err?.message || err || "Error fetching booking");
    }
  }
);
