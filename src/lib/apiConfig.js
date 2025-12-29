/**
 * API Configuration
 * Sử dụng environment variable để quản lý URL
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Lấy URL đầy đủ cho API endpoint
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
 * @returns {string} - Full URL
 */
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_URL}${cleanEndpoint}`;
};

/**
 * Gửi request với authorization header
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} - Response từ server
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers,
  });

  return response;
};

export default {
  API_URL,
  getApiUrl,
  apiRequest,
};
