import axios from "axios";

// Use a relative base path so all API requests go through the Vite dev server
// proxy (configured in vite.config.ts). This avoids CORS preflight round-trips
// on large multipart uploads, which caused intermittent request aborts.
//
// In production, VITE_API_URL can be set to an absolute URL (e.g. your deployed
// API origin) and the proxy is irrelevant — but for dev, keep it unset or empty
// so requests go through the proxy.
const apiUrl = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 120000, // 2 minutes — large image batches can take time to process
  // Remove axios's default 10 MB cap on request/response bodies.
  // Actual size enforcement is handled server-side by multer (MAX_UPLOAD_SIZE_MB).
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

api.interceptors.request.use((config) => {
  console.log("➡️ REQUEST");
  console.log(config.url);
  console.log(config.data);

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("✅ RESPONSE", response.status);
    return response;
  },
  (error) => {
    console.log("❌ AXIOS ERROR");
    console.log(error);
    console.log("code =", error.code);
    console.log("message =", error.message);
    console.log("name =", error.name);
    console.log("response =", error.response);
    console.log("request =", error.request);

    throw error;
  }
);
