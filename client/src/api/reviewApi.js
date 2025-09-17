
import axios from './axiosInstance';


export const postReview = async (payload) => {
  const { data } = await axios.post('/reviews', payload);
  return data;
};

export const getReviews = async (page = 1) => {
  const { data } = await axios.get(`/reviews?page=${page}`);
  return data;
};

export const getPublicReviews = async (page = 1) => {
  const { data } = await axios.get(`/reviews/public?page=${page}`);
  return data;
};

export const deleteReviewApi = async (id) => {
  const { data } = await axios.delete(`/reviews/${id}`);
  return data;
};


export const getMyReview = async () => {
  const { data } = await axios.get('/reviews/mine');
  return data;
};
