import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: false,
});

// Attach token + vaultKey automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  const vaultKey = localStorage.getItem("vaultKey");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  if (vaultKey) {
    req.headers["vaultkey"] = vaultKey;
  }

  return req;
});

export default API;