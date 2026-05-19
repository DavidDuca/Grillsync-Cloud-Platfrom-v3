"use client";
import axios from "axios";

export const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("gs_token");
    if (t) c.headers.Authorization = `Bearer ${t}`;
  }
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("gs_token");
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(e);
  }
);
