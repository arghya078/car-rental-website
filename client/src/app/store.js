// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import carReducer from '../features/cars/carSlice';
import bookingReducer from '../features/bookings/bookingSlice';
import paymentReducer from '../features/payments/paymentSlice';
import usersReducer from '../features/users/userSlice';
import adminReducer from '../features/admin/adminSlice';
import ownerReducer from '../features/owners/ownerSlice';
import reviewReducer from '../features/reviews/reviewSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    owners: ownerReducer,
    admin: adminReducer,
    cars: carReducer,
    bookings: bookingReducer,
    payments: paymentReducer,
    reviews: reviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false 
    }),
  devTools: import.meta.env.DEV
});

export default store;
