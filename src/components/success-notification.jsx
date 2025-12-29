"use client";

import { toast } from "react-toastify";

/**
 * Hiển thị thông báo thành công đơn giản
 * Chỉ hiển thị dòng chữ "Thanh toán thành công" mà không có checkmark hoặc thông tin khác
 */
export const showSuccessNotification = (message = "Thanh toán thành công") => {
  return toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    icon: false, // Ẩn checkmark icon
  });
};

/**
 * Hiển thị thông báo đang đợi xử lí
 */
export const showProcessingNotification = (message = "Đang xử lý...") => {
  return toast.info(message, {
    position: "top-right",
    autoClose: false,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false,
  });
};

/**
 * Hiển thị thông báo nhắc nhở
 */
export const showReminderNotification = (message) => {
  return toast.warning(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Hiển thị thông báo lỗi
 */
export const showErrorNotification = (message) => {
  return toast.error(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};
