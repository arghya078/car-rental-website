
import { createSlice } from '@reduxjs/toolkit';
import {
  fetchReviews,
  fetchPublicReviews,
  postReviewThunk,
  deleteReviewThunk,
  getMyReviewThunk,
} from './reviewThunks';

const initialState = {
  list: [],
  page: 1,
  totalPages: 1,
  limit: 10,
  total: 0,
  count: 0,
  loading: false,
  error: null,
  postLoading: false,
  postError: null,
  postSuccess: null,
  deleteLoading: false,
  deleteError: null,
  myReview: null,
  myReviewLoading: false,
  myReviewError: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearPostState(state) {
      state.postLoading = false;
      state.postError = null;
      state.postSuccess = null;
    },
    clearDeleteError(state) {
      state.deleteError = null;
    },
    clearList(state) {
      state.list = [];
      state.page = 1;
      state.totalPages = 1;
      state.total = 0;
      state.count = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchReviews
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.page = payload.page || 1;
        state.totalPages = payload.totalPages || 1;
        state.limit = payload.limit || 10;
        state.total = payload.total || 0;
        state.count = payload.count || (payload.reviews || []).length;
        state.list = payload.reviews || [];
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      })

      // fetchPublicReviews (guests)
      .addCase(fetchPublicReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicReviews.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.page = payload.page || 1;
        state.totalPages = payload.totalPages || 1;
        state.limit = payload.limit || 10;
        state.total = payload.total || 0;
        state.count = payload.count || (payload.reviews || []).length;
        state.list = payload.reviews || [];
      })
      .addCase(fetchPublicReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      })

      // postReviewThunk
      .addCase(postReviewThunk.pending, (state) => {
        state.postLoading = true;
        state.postError = null;
        state.postSuccess = null;
      })
      .addCase(postReviewThunk.fulfilled, (state, { payload }) => {
        state.postLoading = false;
        state.postSuccess = payload.message || 'Review posted';
        if (payload.review) {
          state.myReview = payload.review;
        }
      })
      .addCase(postReviewThunk.rejected, (state, action) => {
        state.postLoading = false;
        state.postError = action.payload?.message || action.error.message;
      })

      // deleteReviewThunk
      .addCase(deleteReviewThunk.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteReviewThunk.fulfilled, (state, { payload }) => {
        state.deleteLoading = false;
        // remove from list
        state.list = state.list.filter((r) => String(r._id) !== String(payload.id));
      })
      .addCase(deleteReviewThunk.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload?.message || action.error.message;
      })

      // getMyReview
      .addCase(getMyReviewThunk.pending, (state) => {
        state.myReviewLoading = true;
        state.myReviewError = null;
      })
      .addCase(getMyReviewThunk.fulfilled, (state, { payload }) => {
        state.myReviewLoading = false;
        state.myReview = payload?.review ?? payload ?? null;
      })
      .addCase(getMyReviewThunk.rejected, (state, action) => {
        state.myReviewLoading = false;
        state.myReviewError = action.payload?.message || action.error.message;
      });
  },
});

export const { clearPostState, clearDeleteError, clearList } = reviewSlice.actions;
export default reviewSlice.reducer;
