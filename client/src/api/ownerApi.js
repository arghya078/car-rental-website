import axios from "./axiosInstance";


const submitKyc = (formData, token) =>
  axios.post("/owners/kyc", formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

export default {
  submitKyc,
};
