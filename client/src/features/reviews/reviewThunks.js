
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getReviews,
  getPublicReviews,
  postReview,
  deleteReviewApi,
  getMyReview,
} from '../../api/reviewApi';

// fetchReviews
export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (page = 1, { rejectWithValue }) => {
    try {
      const data = await getReviews(page);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// fetchPublicReviews
export const fetchPublicReviews = createAsyncThunk(
  'reviews/fetchPublicReviews',
  async (page = 1, { rejectWithValue }) => {
    try {
      const data = await getPublicReviews(page);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// postReview
export const postReviewThunk = createAsyncThunk(
  'reviews/postReview',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await postReview(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// deleteReview
export const deleteReviewThunk = createAsyncThunk(
  'reviews/deleteReview',
  async (id, { rejectWithValue }) => {
    try {
      const data = await deleteReviewApi(id);
      return { id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// getMyReview
export const getMyReviewThunk = createAsyncThunk(
  'reviews/getMyReview',
  async (_, { rejectWithValue }) => {
    try {
      if (!getMyReview) return rejectWithValue({ message: 'Not implemented' });
      const data = await getMyReview();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);
