import axios from "axios";

// Your Render backend
const API_BASE = "https://course-backend-0lye.onrender.com";

// Login route
const LOGIN_ROUTE = "/login";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("username");

          if (window.location.pathname !== LOGIN_ROUTE) {
            window.location.href = LOGIN_ROUTE;
          }
          break;

        case 403:
          console.error("Access denied");
          break;

        case 500:
          console.error("Server error");
          break;

        default:
          break;
      }
    }

    return Promise.reject(error);
  }
);

export default api;