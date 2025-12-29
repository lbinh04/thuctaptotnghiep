/**
 * API Error Handler Utility
 * - Centralized error handling
 * - Consistent error messages
 * - Better error logging
 */

export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ApiError";
  }
}

/**
 * Xử lý response từ API
 * @param {Response} response - Fetch response
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {ApiError} - Nếu response không OK
 */
export const handleApiResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || "Có lỗi xảy ra. Vui lòng thử lại!",
      response.status,
      data
    );
  }

  return data;
};

/**
 * Xử lý API call với error handling
 * @param {string} url - API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - API response
 * @throws {ApiError}
 */
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiError(
        "Lỗi kết nối đến server. Vui lòng kiểm tra kết nối mạng!",
        0,
        error
      );
    }

    throw new ApiError(error.message || "Có lỗi không xác định", 500, error);
  }
};

/**
 * Tạo request body với validation
 */
export const createRequestBody = (data, requiredFields = []) => {
  // Validate required fields
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new ApiError(
      `Vui lòng điền đầy đủ thông tin: ${missingFields.join(", ")}`,
      400
    );
  }

  return JSON.stringify(data);
};
