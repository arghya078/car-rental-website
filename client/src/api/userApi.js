
import api from "./axiosInstance";

const getProfile = () => api.get("/users/get-profile").then(r => r.data);

const updateProfile = (formData) =>
  api.put("/users/update-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);

const deleteProfile = () => api.delete("/users/delete-profile").then(r => r.data);

export default {
  getProfile,
  updateProfile,
  deleteProfile,
};
